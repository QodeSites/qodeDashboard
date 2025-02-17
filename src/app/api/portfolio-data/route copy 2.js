import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const monthsFull = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * Determines the appropriate nav field.
 * Some records may use `nav` while others use `nav_value`.
 * @param {Array} dailyNAV 
 * @returns {string} The field name to use.
 */
function getNavField(dailyNAV) {
  return dailyNAV.length > 0 && dailyNAV[0].hasOwnProperty("nav") ? "nav" : "nav_value";
}

/**
 * Calculates the monthly PnL based on daily NAV data.
 * @param {Array} dailyNAV - Array of daily NAV records.
 * @returns {Array} - Array of monthly PnL objects.
 */
function calculateMonthlyPnL(dailyNAV) {
  if (!dailyNAV || dailyNAV.length === 0) {
    return [];
  }
  const navField = getNavField(dailyNAV);

  const navByMonth = dailyNAV.reduce((acc, nav) => {
    const date = new Date(nav.date);
    const month = date.getMonth(); // 0-based index
    const year = date.getFullYear();
    const key = `${year}-${month}`; // e.g., "2023-0" for January 2023

    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(nav);
    return acc;
  }, {});

  const monthlyPnL = Object.keys(navByMonth).map(key => {
    const [year, monthIndex] = key.split("-").map(Number);
    const navs = navByMonth[key].sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstNAV = parseFloat(navs[0][navField]) || 0;
    const lastNAV = parseFloat(navs[navs.length - 1][navField]) || 0;
    const pnl = ((lastNAV - firstNAV) / firstNAV) * 100;

    return {
      year,
      month: monthsFull[monthIndex],
      firstNAV,
      lastNAV,
      pnl: parseFloat(pnl.toFixed(2)),
    };
  });

  // Sort by year and month
  monthlyPnL.sort((a, b) => {
    if (a.year !== b.year) {
      return a.year - b.year;
    }
    return monthsFull.indexOf(a.month) - monthsFull.indexOf(b.month);
  });

  return monthlyPnL;
}

/**
 * Fetches cash in/out data for given nuvama codes.
 * @param {string[]} nuvamaCodes - Array of nuvama codes.
 * @returns {Promise<Array>} - Promise resolving to cash in/out data.
 */
async function fetchCashInOutData(nuvamaCodes) {
  return await prisma.$queryRaw`
    SELECT date, nuvama_code, cash_in_out 
    FROM pms_clients_tracker.pms_cash_in_out 
    WHERE nuvama_code = ANY(${nuvamaCodes}::varchar[])
    ORDER BY date ASC
  `;
}

/**
 * Returns the strategy name based on the nuvama code.
 * For example:
 *  - "QFH0002" returns "QFH"
 *  - "QAW0002" returns "QAW"
 *  - "QTH0002" returns "QTF"
 *  - "QGF0002" returns "QGF"
 * @param {string} code 
 * @returns {string}
 */
const getStrategy = (code) => {
  if (code.startsWith("QFH")) return "QFH";
  if (code.startsWith("QAW")) return "QAW";
  if (code.startsWith("QTH")) return "QTF";
  if (code.startsWith("QGF")) return "QGF";
  return "";
};

/* Processes the cumulative view data grouped by nuvama code */
async function processCumulativeView(userNuvamaCodes, userEmail) {
  // Process each nuvama code individually
  const results = await Promise.all(userNuvamaCodes.map(async (code) => {
    // --- Portfolio Details ---
    // Fetch all portfolio records for this code
    const portfolioRecords = await prisma.portfolio_details.findMany({
      where: { nuvama_code: code },
    });
    
    // Aggregate portfolio details for this code
    const aggregatedPortfolio = portfolioRecords.reduce((acc, portfolio) => {
      const initialInvestment = parseFloat(portfolio.initial_investment) || 0;
      const portfolioValue = parseFloat(portfolio.portfolio_value) || 0;
      const cash = parseFloat(portfolio.cash) || 0;
      return {
        initial_investment: acc.initial_investment + initialInvestment,
        portfolio_value: acc.portfolio_value + portfolioValue,
        cash: acc.cash + cash,
        name: acc.name || portfolio.name,
      };
    }, { initial_investment: 0, portfolio_value: 0, cash: 0, name: "" });

    // Adjust portfolio name if the user is one of the specified ones
    if (aggregatedPortfolio.name) {
      if (userEmail === "hiren@prithvigroup.biz") {
        aggregatedPortfolio.name = "HIREN ZAVERCHAND GALA";
      } else if (userEmail === "rishabh.nahar@qodeinvest.com") {
        aggregatedPortfolio.name = "Rishabh Nahar";
      }
    }
    
    // For an individual nuvama code, if there's any portfolio value then its ratio is 100%
    const portfoliosWithRatios = aggregatedPortfolio.portfolio_value > 0 ? [{
      ...aggregatedPortfolio,
      ratio: 1
    }] : [];

    // --- Daily NAV ---
    const dailyNAVRecords = await prisma.daily_nav.findMany({
      where: { nuvama_code: code },
      orderBy: { date: "asc" },
    });
    const monthlyPnL = calculateMonthlyPnL(dailyNAVRecords);
    
    // --- Cash In/Out Data ---
    const cashInOutDataRaw = await fetchCashInOutData([code]);
    const processedCashInOut = cashInOutDataRaw.map(record => ({
      date: record.date,
      cash_in_out: parseFloat(record.cash_in_out) || 0,
      strategy: getStrategy(record.nuvama_code)
    }));

    return {
      nuvama_code: code,
      strategy: getStrategy(code),
      dailyNAV: dailyNAVRecords || [],
      portfolioDetails: aggregatedPortfolio || {},
      portfoliosWithRatios,
      monthlyPnL,
      cashInOutData: processedCashInOut || []
    };
  }));

  // --- Total Portfolio Aggregation ---
  let totalInvested = 0;
  let totalPortfolioValue = 0;
  let totalCash = 0;
  let aggregatedCashInOut = [];

  results.forEach(result => {
    const pd = result.portfolioDetails;
    totalInvested += Number(pd.initial_investment) || 0;
    totalPortfolioValue += Number(pd.portfolio_value) || 0;
    totalCash += Number(pd.cash) || 0;

    // Merge cash in/out records from each strategy
    if (result.cashInOutData && result.cashInOutData.length > 0) {
      aggregatedCashInOut.push(...result.cashInOutData);
    }
  });
  
  // Optionally sort aggregated cash in/out records by date
  aggregatedCashInOut.sort((a, b) => new Date(a.date) - new Date(b.date));

  const totalProfit = totalPortfolioValue - totalInvested;
  const totalOverallReturns = totalInvested > 0 ? parseFloat(((totalProfit / totalInvested) * 100).toFixed(2)) : 0;
  
  const totalPortfolio = {
    total_invested: totalInvested,
    total_portfolio_value: totalPortfolioValue,
    total_profit: totalProfit,
    total_cash: totalCash,
    total_overall_returns: totalOverallReturns,
    cashInOutFlows: aggregatedCashInOut,
  };

  return {
    view_type: "cumulative",
    strategies: results,
    totalPortfolio,
  };
}

async function processIndividualView(nuvama_code, userEmail) {
  const [dailyNAV, portfolioDetailsRecords, cashInOutDataRaw] = await Promise.all([
    prisma.daily_nav.findMany({
      where: { nuvama_code },
      orderBy: { date: "asc" },
    }),
    prisma.portfolio_details.findMany({
      where: { nuvama_code },
    }),
    fetchCashInOutData([nuvama_code])
  ]);

  if (!dailyNAV.length && (!portfolioDetailsRecords || portfolioDetailsRecords.length === 0)) {
    throw new Error("No data found for the provided nuvama_code");
  }

  // Aggregate portfolio details if multiple records exist
  const aggregatedPortfolio = portfolioDetailsRecords.reduce((acc, portfolio) => {
    const initialInvestment = parseFloat(portfolio.initial_investment) || 0;
    const portfolioValue = parseFloat(portfolio.portfolio_value) || 0;
    const cash = parseFloat(portfolio.cash) || 0;
    return {
      initial_investment: acc.initial_investment + initialInvestment,
      portfolio_value: acc.portfolio_value + portfolioValue,
      cash: acc.cash + cash,
      name: acc.name || portfolio.name,
    };
  }, { initial_investment: 0, portfolio_value: 0, cash: 0, name: "" });

  if (aggregatedPortfolio.name) {
    if (userEmail === "hiren@prithvigroup.biz") {
      aggregatedPortfolio.name = "HIREN ZAVERCHAND GALA";
    } else if (userEmail === "rishabh.nahar@qodeinvest.com") {
      aggregatedPortfolio.name = "Rishabh Nahar";
    }
  }

  const portfoliosWithRatios = aggregatedPortfolio.portfolio_value > 0 ? [{
    ...aggregatedPortfolio,
    ratio: 1
  }] : [];

  const monthlyPnL = calculateMonthlyPnL(dailyNAV);
  const processedCashInOut = cashInOutDataRaw.map(record => ({
    date: record.date,
    cash_in_out: parseFloat(record.cash_in_out) || 0,
    strategy: getStrategy(record.nuvama_code)
  }));

  return {
    view_type: "individual",
    nuvama_code,
    strategy: getStrategy(nuvama_code),
    dailyNAV: dailyNAV || [],
    portfolioDetails: aggregatedPortfolio || {},
    portfoliosWithRatios,
    monthlyPnL,
    cashInOutData: processedCashInOut
  };
}

export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Normalize user email and convert user id to number
    const userEmail = session.user.email.toLowerCase();
    const user_id = Number(session.user.id);
    // console.log("user_id", user_id);

    // Fetch the list of nuvama_codes from the client_master table for this user
    const clientMasterRecords = await prisma.client_master.findMany({
      where: { user_id },
      select: { nuvama_code: true },
    });
    const userNuvamaCodes = clientMasterRecords.map(record => record.nuvama_code);

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const nuvama_code = searchParams.get("nuvama_code");
    const view_type = searchParams.get("view_type") || "individual";

    if (view_type === "cumulative") {
      const result = await processCumulativeView(userNuvamaCodes, userEmail);
      return NextResponse.json(result);
    }

    if (view_type === "individual" && nuvama_code) {
      // Validate that the requested nuvama_code belongs to the user
      if (!userNuvamaCodes.includes(nuvama_code)) {
        return NextResponse.json(
          { error: "Unauthorized access to this nuvama code" },
          { status: 403 }
        );
      }
      const result = await processIndividualView(nuvama_code, userEmail);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Invalid view type. Must be 'individual' or 'cumulative'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
