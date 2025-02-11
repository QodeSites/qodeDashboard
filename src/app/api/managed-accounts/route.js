import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const DEFAULT_PAGE_SIZE = 2000;

const PORTFOLIO_MAPPING = {
  AC5: {
    "Scheme A": {
      current: "Sarla Performance fibers Zerodha Total Portfolio A",
      metrics: "Sarla Performance fibers Zerodha Total Portfolio A"
    },
    "Scheme B": {
      current: "Sarla Performance fibers Zerodha Total Portfolio B",
      metrics: "Sarla Performance fibers Total Portfolio B"
    },
    "Scheme C": {
      current: "Sarla Performance fibers Zerodha Total Portfolio C",
      metrics: "Sarla Performance fibers Zerodha Total Portfolio C"
    },
    "Scheme D": {
      current: "Sarla Performance fibers Zerodha Total Portfolio D",
      metrics: "Sarla Performance fibers Zerodha Total Portfolio D"
    },
    "Scheme E": {
      current: "Sarla Performance fibers Zerodha Total Portfolio E",
      metrics: "Sarla Performance fibers Zerodha Total Portfolio E"
    },
    "Scheme F": {
      current: "Sarla Performance fibers Zerodha Total Portfolio F",
      metrics: "Sarla Performance fibers Zerodha Total Portfolio F"
    },
    "_total": {
      current: "Sarla Performance fibers Zerodha Total Portfolio",
      metrics: "Sarla Performance fibers Zerodha Total Portfolio"
    }
  },
  AC6: {
    "Scheme A": {
      current: "Priyavrata Mafatlal Zerodha Total Portfolio",
      metrics: "Priyavrata Mafatlal Zerodha Total Portfolio"
    },
    "_total": {
      current: "Priyavrata Mafatlal Zerodha Total Portfolio",
      metrics: "Priyavrata Mafatlal Zerodha Total Portfolio"
    }
  },
  AC7: {
    "Scheme A": {
      current: "Raj Jhaveri Zerodha Total Portfolio",
      metrics: "Raj Jhaveri Zerodha Total Portfolio"
    },
    "_total": {
      current: "Raj Jhaveri Zerodha Total Portfolio",
      metrics: "Raj Jhaveri Zerodha Total Portfolio"
    }
  },
  AC8: {
    "Scheme A": {
      current: "Satidham Industries Zerodha Total Portfolio",
      metrics: "Satidham Industries Zerodha Total Portfolio"
    },
    "_total": {
      current: "Satidham Industries Zerodha Total Portfolio",
      metrics: "Satidham Industries Zerodha Total Portfolio"
    }
  },
  AC9: {
    "Scheme B": {
      current: "Deepti Parikh Zerodha Total Portfolio",
      metrics: "Deepti Parikh Total Portfolio B"
    },
    "_total": {
      current: "Deepti Parikh Zerodha Total Portfolio",
      metrics: "Deepti Parikh Zerodha Total Portfolio"
    }
  }
};
// Map account codes to client names for reference
const CLIENT_NAMES = {
  AC5: "Sarla Performance Fibers Limited",
  AC6: "Priyavrata Mafatlal",
  AC7: "Raj Jhaveri",
  AC8: "Satidham Industries",
  AC9: "Deepti Parikh"
};


function calculateDrawdownMetrics(navData) {
  if (!navData || navData.length === 0) return { currentDD: 0, mdd: 0, ddCurve: [] };

  let peak = navData[0].nav;
  let mdd = 0;
  const ddCurve = [];

  navData.forEach(point => {
    if (point.nav > peak) {
      peak = point.nav;
    }
    const drawdown = ((peak - point.nav) / peak) * 100;
    mdd = Math.max(mdd, drawdown);
    ddCurve.push({
      date: point.date,
      drawdown: drawdown
    });
  });

  const currentDD = ddCurve[ddCurve.length - 1]?.drawdown || 0;

  return {
    currentDD,
    mdd,
    ddCurve
  };
}

function calculateReturns(navData) {
  // console.log("NAV Data:", navData);

  if (!navData || navData.length < 2) {
    console.log("Insufficient NAV data points");
    return 0;
  }

  const firstDate = new Date(navData[0].date);
  const lastDate = new Date(navData[navData.length - 1].date);
  const daysDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24);


  const firstNav = navData[0].nav;
  const lastNav = navData[navData.length - 1].nav;
  const totalReturn = (lastNav / firstNav) - 1; // total return as a decimal

  if (daysDiff <= 365) {
    const absoluteReturn = totalReturn * 100;
    return absoluteReturn;
  } else {
    // Annualize the return (CAGR)
    const annualizedReturn = (Math.pow((1 + totalReturn), (365 / daysDiff)) - 1) * 100;
    console.log("Annualized Return:", annualizedReturn);
    return annualizedReturn;
  }
}

function calculateTrailingReturns(navData, periods = {
  "5d": 5,     // Index 5 to get Jan 30
  "10d": 10,   // Index 10 to get Jan 23
  "15d": 15,   // Index 15 to get Jan 16
  "1m": 30,    // One month
  "1y": 365,   // One year
  "2y": 730,   // Two years
  "3y": 1095   // Three years
}) {
  if (!navData || navData.length === 0) return {};

  // Sort data by date in descending order
  const sortedData = [...navData].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const lastNav = sortedData[0].nav;
  const currentDate = new Date(sortedData[0].date);
  const returns = {};

  Object.entries(periods).forEach(([period, targetCount]) => {
    // For periods less than a month, use index-based calculation (absolute return)
    if (["5d", "10d", "15d"].includes(period)) {
      if (sortedData.length > targetCount) {
        const historicalEntry = sortedData[targetCount];
        if (historicalEntry) {
          returns[period] = ((lastNav - historicalEntry.nav) / historicalEntry.nav) * 100;
        } else {
          returns[period] = null;
        }
      } else {
        returns[period] = null;
      }
    } 
    // For periods >= 1 month, use date-based calculation
    else {
      // Calculate target date based on the period
      const targetDate = new Date(currentDate);
      if (period === "1m") {
        targetDate.setMonth(targetDate.getMonth() - 1);
      } else if (period === "1y") {
        targetDate.setFullYear(targetDate.getFullYear() - 1);
      } else if (period === "2y") {
        targetDate.setFullYear(targetDate.getFullYear() - 2);
      } else if (period === "3y") {
        targetDate.setFullYear(targetDate.getFullYear() - 3);
      }

      // Find the closest date entry that's earlier than or equal to the target date
      let closestEntry = null;
      for (const entry of sortedData) {
        const entryDate = new Date(entry.date);
        if (entryDate <= targetDate) {
          closestEntry = entry;
          break;
        }
      }

      if (closestEntry) {
        // For periods 1 year or longer, calculate XIRR (annualized return)
        if (["1y", "2y", "3y"].includes(period)) {
          const historicalDate = new Date(closestEntry.date);
          const daysDiff = (currentDate - historicalDate) / (1000 * 60 * 60 * 24);
          // Calculate annualized return (XIRR)
          const annualizedReturn = Math.pow(lastNav / closestEntry.nav, 365 / daysDiff) - 1;
          returns[period] = annualizedReturn * 100;

          // For debugging
          console.log(`${period} (XIRR):`, {
            targetDate,
            actualDate: historicalDate,
            nav: closestEntry.nav,
            annualizedReturn: returns[period]
          });
        } else {
          // For periods like "1m", use absolute return if desired
          returns[period] = ((lastNav - closestEntry.nav) / closestEntry.nav) * 100;

          // For debugging
          console.log(`${period} (Absolute):`, {
            targetDate,
            actualDate: new Date(closestEntry.date),
            nav: closestEntry.nav,
            return: returns[period]
          });
        }
      } else {
        returns[period] = null;
      }
    }
  });

  return returns;
}


function calculateMonthlyPnL(navData) {
  if (!navData || navData.length === 0) return {};

  const dataByMonth = navData.reduce((acc, entry) => {
    const date = new Date(entry.date);
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!acc[yearMonth]) {
      acc[yearMonth] = [];
    }
    acc[yearMonth].push({
      date: entry.date,
      nav: entry.nav
    });

    return acc;
  }, {});

  const sortedMonths = Object.keys(dataByMonth).sort();
  const monthlyPnL = {};

  sortedMonths.forEach((yearMonth, index) => {
    const currentMonthData = dataByMonth[yearMonth];
    const currentMonthEnd = currentMonthData[currentMonthData.length - 1].nav;

    let startNav;
    if (index === 0) {
      startNav = currentMonthData[0].nav;
    } else {
      const previousMonth = sortedMonths[index - 1];
      const previousMonthData = dataByMonth[previousMonth];
      startNav = previousMonthData[previousMonthData.length - 1].nav;
    }

    monthlyPnL[yearMonth] = {
      startDate: index === 0 ? currentMonthData[0].date : dataByMonth[sortedMonths[index - 1]][dataByMonth[sortedMonths[index - 1]].length - 1].date,
      endDate: currentMonthData[currentMonthData.length - 1].date,
      startNav,
      endNav: currentMonthEnd,
      pnl: ((currentMonthEnd - startNav) / startNav) * 100,
      navPoints: currentMonthData.map(point => ({
        date: point.date,
        nav: point.nav
      }))
    };
  });

  const pnlByYear = {};
  Object.entries(monthlyPnL).forEach(([yearMonth, data]) => {
    const year = yearMonth.split('-')[0];
    if (!pnlByYear[year]) {
      pnlByYear[year] = {};
    }
    pnlByYear[year][yearMonth] = data;
  });

  return {
    byYear: pnlByYear,
    byMonth: monthlyPnL
  };
}

function calculateSchemeAllocation(investedAmounts) {
  const total = Object.values(investedAmounts).reduce((sum, amount) => sum + amount, 0);
  const allocation = {};

  Object.entries(investedAmounts).forEach(([scheme, amount]) => {
    allocation[scheme] = (amount / total) * 100;
  });

  return allocation;
}

function getPortfolioNames(accountCode, scheme) {
  if (!PORTFOLIO_MAPPING[accountCode] || !PORTFOLIO_MAPPING[accountCode][scheme]) {
    throw new Error(`Invalid account code (${accountCode}) or scheme (${scheme})`);
  }
  return PORTFOLIO_MAPPING[accountCode][scheme];
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE)));

    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json({ error: "Valid user ID is required" }, { status: 400 });
    }

    const managedAccounts = await prisma.managed_account_clients.findMany({
      where: { id: parseInt(userId) },
      select: { account_code: true },
    });

    const accountCodes = managedAccounts.map((account) => account.account_code);
    if (accountCodes.length === 0) {
      return NextResponse.json({
        error: "No accounts found for the user",
        userId
      }, { status: 404 });
    }

    const [cashInOutData, masterSheetData] = await Promise.all([
      prisma.managed_accounts_cash_in_out.findMany({
        where: { account_code: { in: accountCodes } },
        select: {
          date: true,
          account_code: true,
          scheme: true,
          capital_in_out: true,
          dividend: true,
        },
        orderBy: { date: "asc" },
      }),
      prisma.master_sheet.findMany({
        where: { account_tag: { in: accountCodes } },
        orderBy: { date: "asc" },
      }),
    ]);

    const results = {};

    for (const accountCode of accountCodes) {
      results[accountCode] = {
        clientName: CLIENT_NAMES[accountCode] || "Unknown Client",
        schemes: {},
        totalPortfolio: {}
      };

      const schemes = Object.keys(PORTFOLIO_MAPPING[accountCode] || {})
        .filter(scheme => scheme !== '_total');
      const schemeInvestedAmounts = {};

      // Process individual schemes
      for (const scheme of schemes) {
        const portfolioNames = getPortfolioNames(accountCode, scheme);

        const currentData = masterSheetData.filter(
          (entry) => entry.account_names === portfolioNames.current
        );
        const metricsData = masterSheetData.filter(
          (entry) => entry.account_names === portfolioNames.metrics
        );
        const cashForScheme = cashInOutData.filter(
          (entry) => entry.account_code === accountCode && entry.scheme === scheme
        );

        const investedAmount = cashForScheme.reduce((sum, entry) => {
          const capitalAmount = entry.capital_in_out || 0;
          const dividendAmount = entry.dividend || 0;
          return sum + capitalAmount + dividendAmount;
        }, 0);

        schemeInvestedAmounts[scheme] = investedAmount;

        const navCurve = metricsData.map((e) => ({
          date: e.date,
          nav: e.nav
        }));

        const drawdownMetrics = calculateDrawdownMetrics(navCurve);

        results[accountCode].schemes[scheme] = {
          currentPortfolioValue: currentData.length > 0
            ? currentData[currentData.length - 1].portfolio_value || 0
            : 0,
          investedAmount,
          returns: calculateReturns(navCurve, cashForScheme),
          trailingReturns: calculateTrailingReturns(navCurve),
          monthlyPnL: calculateMonthlyPnL(navCurve),
          navCurve,
          currentDrawdown: drawdownMetrics.currentDD,
          maxDrawdown: drawdownMetrics.mdd,
          drawdownCurve: drawdownMetrics.ddCurve,
          cashFlows: cashForScheme.map(flow => ({
            date: flow.date,
            amount: flow.capital_in_out,
            dividend: flow.dividend
          }))
        };
      }

      // Process total portfolio metrics
      const totalPortfolioNames = PORTFOLIO_MAPPING[accountCode]._total;
      const totalCurrentData = masterSheetData.filter(
        (entry) => entry.account_names === totalPortfolioNames.current
      );
      const totalMetricsData = masterSheetData.filter(
        (entry) => entry.account_names === totalPortfolioNames.metrics
      );

      const totalInvestedAmount = Object.values(schemeInvestedAmounts)
        .reduce((sum, amount) => sum + amount, 0);

      const totalNavCurve = totalMetricsData.map((e) => ({
        date: e.date,
        nav: e.nav
      }));

      const totalDrawdownMetrics = calculateDrawdownMetrics(totalNavCurve);
      const totalCashFlows = cashInOutData
        .filter(flow => flow.account_code === accountCode)
        .map(flow => ({
          date: flow.date,
          scheme: flow.scheme, // Added scheme property
          amount: flow.capital_in_out,
          dividend: flow.dividend
        }));
      results[accountCode].totalPortfolio = {
        currentPortfolioValue: totalCurrentData.length > 0
          ? totalCurrentData[totalCurrentData.length - 1].portfolio_value || 0
          : 0,
        investedAmount: totalInvestedAmount,
        returns: calculateReturns(totalNavCurve),
        trailingReturns: calculateTrailingReturns(totalNavCurve),
        monthlyPnL: calculateMonthlyPnL(totalNavCurve),
        navCurve: totalNavCurve,
        currentDrawdown: totalDrawdownMetrics.currentDD,
        maxDrawdown: totalDrawdownMetrics.mdd,
        drawdownCurve: totalDrawdownMetrics.ddCurve,
        schemeAllocation: calculateSchemeAllocation(schemeInvestedAmounts),
        cashFlows: totalCashFlows
      };
    }

    return NextResponse.json({
      data: {
        accounts: results
      },
      pagination: {
        page,
        pageSize,
        totalAccounts: accountCodes.length
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Portfolio API Error:", error);
    return NextResponse.json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}