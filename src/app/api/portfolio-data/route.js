import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const monthsFull = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * Calculates the monthly PnL based on daily NAV data.
 * @param {Array} dailyNAV - Array of daily NAV records.
 * @returns {Array} - Array of monthly PnL objects.
 */
function calculateMonthlyPnL(dailyNAV) {
  if (!dailyNAV || dailyNAV.length === 0) {
    return [];
  }

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
    const firstNAV = parseFloat(navs[0].nav) || 0;
    const lastNAV = parseFloat(navs[navs.length - 1].nav) || 0;
    const pnl = (lastNAV - firstNAV) / firstNAV * 100;

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
 * Fetches cash in/out data for given nuvama codes
 * @param {string[]} nuvamaCodes - Array of nuvama codes
 * @returns {Promise<Array>} - Promise resolving to cash in/out data
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
 * Processes the cumulative view data
 */
async function processCumulativeView(userNuvamaCodes, userEmail) {
  // Fetch all required data in parallel
  const [allPortfolioDetails, allDailyNAV, cashInOutData] = await Promise.all([
    prisma.portfolio_details.findMany({
      where: {
        nuvama_code: {
          in: userNuvamaCodes,
        },
      },
    }),
    prisma.daily_nav.findMany({
      where: {
        nuvama_code: {
          in: userNuvamaCodes,
        },
      },
      orderBy: { date: "asc" },
    }),
    fetchCashInOutData(userNuvamaCodes)
  ]);

  // Calculate portfolio ratios
  let totalPortfolioValue = 0;
  const portfolioRatios = allPortfolioDetails.map(portfolio => {
    const portfolioValue = parseFloat(portfolio.portfolio_value) || 0;
    totalPortfolioValue += portfolioValue;
    return {
      name: portfolio.name,
      nuvama_code: portfolio.nuvama_code,
      portfolio_value: portfolioValue,
    };
  });

  // Calculate ratios for each portfolio
  const portfoliosWithRatios = portfolioRatios.map(portfolio => ({
    ...portfolio,
    ratio: totalPortfolioValue > 0 ? (portfolio.portfolio_value / totalPortfolioValue) : 0,
  }));

  // Calculate cumulative portfolio details
  const cumulativeDetails = allPortfolioDetails.reduce((acc, portfolio) => {
    const initialInvestment = parseFloat(portfolio.initial_investment) || 0;
    const portfolioValue = parseFloat(portfolio.portfolio_value) || 0;
    const cash = parseFloat(portfolio.cash) || 0;
    const name = userEmail === "hiren@prithvigroup.biz"
      ? "HIREN ZAVERCHAND GALA"
      : portfolio.name;

    return {
      initial_investment: acc.initial_investment + initialInvestment,
      portfolio_value: acc.portfolio_value + portfolioValue,
      cash: acc.cash + cash,
      name: name,
    };
  }, {
    initial_investment: 0,
    portfolio_value: 0,
    cash: 0,
    name: userEmail === "hiren@prithvigroup.biz" ? "HIREN ZAVERCHAND GALA" : allPortfolioDetails[0]?.name || "",
  });

  // Calculate cumulative daily NAV
  const navByDate = allDailyNAV.reduce((acc, nav) => {
    const dateStr = new Date(nav.date).toISOString().split('T')[0];
    
    if (!acc[dateStr]) {
      acc[dateStr] = {
        date: nav.date,
        nav_value: 0,
        benchmark_value: 0,
        count: 0,
      };
    }

    const navValue = parseFloat(nav.nav_value) || 0;
    const benchmarkValue = parseFloat(nav.benchmark_value) || 0;

    acc[dateStr].nav_value += navValue;
    acc[dateStr].benchmark_value += benchmarkValue;
    acc[dateStr].count += 1;

    return acc;
  }, {});

  const cumulativeDailyNAV = Object.values(navByDate)
    .map(daily => ({
      date: daily.date,
      nav_value: daily.count > 0 ? (daily.nav_value / daily.count) : 0,
      benchmark_value: daily.count > 0 ? (daily.benchmark_value / daily.count) : 0,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Process cash in/out data
  const processedCashInOut = cashInOutData.map(record => ({
    date: record.date,
    nuvama_code: record.nuvama_code,
    cash_in_out: parseFloat(record.cash_in_out) || 0
  }));

  const monthlyPnL = calculateMonthlyPnL(cumulativeDailyNAV);

  return {
    view_type: "cumulative",
    nuvama_codes: userNuvamaCodes,
    dailyNAV: cumulativeDailyNAV,
    portfolioDetails: cumulativeDetails,
    portfoliosWithRatios,
    monthlyPnL,
    cashInOutData: processedCashInOut
  };
}

/**
 * Processes the individual view data
 */
async function processIndividualView(nuvama_code, userEmail) {
  const [dailyNAV, portfolioDetails, cashInOutData] = await Promise.all([
    prisma.daily_nav.findMany({
      where: { nuvama_code },
      orderBy: { date: "asc" },
    }),
    prisma.portfolio_details.findFirst({
      where: { nuvama_code },
    }),
    fetchCashInOutData([nuvama_code])
  ]);

  if (!dailyNAV.length && !portfolioDetails) {
    throw new Error("No data found for the provided nuvama_code");
  }

  let processedPortfolioDetails = portfolioDetails;
  if (userEmail === "hiren@prithvigroup.biz" && portfolioDetails) {
    processedPortfolioDetails = { ...portfolioDetails, name: "HIREN ZAVERCHAND GALA" };
  }

  const processedCashInOut = cashInOutData.map(record => ({
    date: record.date,
    cash_in_out: parseFloat(record.cash_in_out) || 0
  }));

  const monthlyPnL = calculateMonthlyPnL(dailyNAV);

  return {
    view_type: "individual",
    nuvama_code,
    dailyNAV: dailyNAV || [],
    portfolioDetails: processedPortfolioDetails || null,
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

    // Normalize user email for case-insensitive comparison
    const userEmail = session.user.email.toLowerCase();

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const nuvama_code = searchParams.get("nuvama_code");
    const view_type = searchParams.get("view_type") || "individual";

    // Get all nuvama_codes for the user from session
    const userNuvamaCodes = Array.isArray(session.user.nuvama_codes)
      ? session.user.nuvama_codes
      : [session.user.nuvama_codes];

    try {
      if (view_type === "cumulative") {
        const result = await processCumulativeView(userNuvamaCodes, userEmail);
        return NextResponse.json(result);
      }

      if (view_type === "individual" && nuvama_code) {
        // Validate nuvama_code belongs to user
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
      if (error.message === "No data found for the provided nuvama_code") {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      throw error;
    }
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