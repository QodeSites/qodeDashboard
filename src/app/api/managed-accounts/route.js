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
      metrics: "Sarla Performance fibers Zerodha Total Portfolio B"
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

const CLIENT_NAMES = {
  AC5: "Sarla Performance Fibers Limited",
  AC6: "Priyavrata Mafatlal",
  AC7: "Raj Jhaveri",
  AC8: "Satidham Industries",
  AC9: "Deepti Parikh"
};

function calculateTotalProfit(masterSheetData, cashFlowData) {
  // Sum up all daily P&L values
  const totalDailyPL = masterSheetData.reduce((sum, entry) => {
    return sum + (entry.daily_pl || 0);
  }, 0);

  // Sum up all dividends
  const totalDividends = cashFlowData.reduce((sum, entry) => {
    return sum + (entry.dividend || 0);
  }, 0);

  return totalDailyPL + totalDividends;
}

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

function calculateReturns(navData, cashInflow) {
  if (!navData || navData.length < 2) {
    console.log("Insufficient NAV data points");
    return 0;
  }

  // console.log(cashInflow)

  const firstDate = new Date(navData[0].date);
  const lastDate = new Date(navData[navData.length - 1].date);
  const daysDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24);

  const firstNav = navData[0].nav;
  const lastNav = navData[navData.length - 1].nav;
  const totalReturn = (lastNav / firstNav) - 1;

  if (daysDiff <= 365) {
    const absoluteReturn = totalReturn * 100;
    return absoluteReturn;
  } else {
    const annualizedReturn = (Math.pow((1 + totalReturn), (365 / daysDiff)) - 1) * 100;
    return annualizedReturn;
  }
}

function calculateTrailingReturns(
  navData,
  periods = {
    "5d": 5,
    "10d": 10,
    "15d": 15,
    "1m": 30,
    "1y": 366,
    "2y": 731,
    "3y": 1095,
  }
) {
  if (!navData || navData.length === 0) return {};

  // Sort data so that the most recent date is first.
  const sortedData = [...navData].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const lastNav = sortedData[0].nav;
  const currentDate = new Date(sortedData[0].date);
  const returns = {};

  // Helper to find an entry matching a given date (YYYY-MM-DD), checking up to maxDaysBack days
  const getClosestEntryForTargetDate = (targetDate, sortedData, maxDaysBack = 10) => {
    let searchDate = new Date(targetDate);
    for (let i = 0; i < maxDaysBack; i++) {
      const candidate = sortedData.find((entry) => {
        const entryDate = new Date(entry.date);
        return (
          entryDate.toISOString().slice(0, 10) ===
          searchDate.toISOString().slice(0, 10)
        );
      });
      if (candidate) return candidate;
      // Subtract one day and try again.
      searchDate.setDate(searchDate.getDate() - 1);
    }
    return null;
  };

  Object.entries(periods).forEach(([period, targetCount]) => {
    if (["5d", "10d", "15d"].includes(period)) {
      // Count-based periods: use the nth element from the sorted array.
      if (sortedData.length > targetCount) {
        const historicalEntry = sortedData[targetCount];
        returns[period] =
          historicalEntry !== undefined
            ? ((lastNav - historicalEntry.nav) / historicalEntry.nav) * 100
            : null;
      } else {
        returns[period] = null;
      }
    } else {
      // Date-based periods: compute the target date.
      const targetDate = new Date(currentDate);
      if (period === "1m") {
        targetDate.setMonth(targetDate.getMonth() - 1);
      } else if (period === "1y") {
        targetDate.setFullYear(targetDate.getFullYear() - 1);
        // For 1y, always start search from one day earlier than the computed target date.
        targetDate.setDate(targetDate.getDate() - 1);
      } else if (period === "2y") {
        targetDate.setFullYear(targetDate.getFullYear() - 2);
      } else if (period === "3y") {
        targetDate.setFullYear(targetDate.getFullYear() - 3);
      }

      // Look for an entry on the target date (or the closest previous day)
      let candidate = getClosestEntryForTargetDate(targetDate, sortedData, 10);

      // Only for "3y": if no candidate is found, fallback to the oldest available entry.
      if (period === "3y" && !candidate) {
        candidate = sortedData[sortedData.length - 1];
      }

      if (candidate) {
        if (["1y", "2y"].includes(period)) {
          // For 1y and 2y, calculate the annualized return using a fixed period.
          const tPeriod = period === "1y" ? 1 : 2;
          const annualizedReturn = Math.pow(lastNav / candidate.nav, 1 / tPeriod) - 1;
          returns[period] = annualizedReturn * 100;
        } else if (period === "3y") {
          // For 3y, calculate the annualized return using the actual period length.
          const candidateDate = new Date(candidate.date);
          const actualPeriodInYears = (currentDate - candidateDate) / (365 * 24 * 60 * 60 * 1000);
          const annualizedReturn = Math.pow(lastNav / candidate.nav, 1 / actualPeriodInYears) - 1;
          returns[period] = annualizedReturn * 100;
        } else {
          // For periods like 1m, use simple return.
          returns[period] = ((lastNav - candidate.nav) / candidate.nav) * 100;
        }
      } else {
        returns[period] = null;
      }
    }
  });

  return returns;
}

function calculateMonthlyPnL(navData) {
  console.log('\n=== Starting PnL Calculation ===');
  console.log('Input data:', JSON.stringify(navData, null, 2));

  if (!navData || navData.length === 0) {
    console.log('No data provided or empty array');
    return {};
  }

  // Group by month and track last NAV for each month
  const dataByMonth = navData.reduce((acc, entry) => {
    const date = new Date(entry.date);
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!acc[yearMonth]) {
      acc[yearMonth] = {
        points: [],
        lastNav: null,
        lastDate: null
      };
      console.log(`\nCreating new month bucket for ${yearMonth}`);
    }

    acc[yearMonth].points.push({
      date: entry.date,
      nav: entry.nav
    });

    // Always update last NAV and date as we want the latest available
    acc[yearMonth].lastNav = entry.nav;
    acc[yearMonth].lastDate = entry.date;

    console.log(`Added to ${yearMonth}: Date=${entry.date}, NAV=${entry.nav}`);
    return acc;
  }, {});

  console.log('\n=== Data Grouped By Month ===');
  console.log(JSON.stringify(dataByMonth, null, 2));

  const sortedMonths = Object.keys(dataByMonth).sort();
  console.log('\nSorted months:', sortedMonths);
  
  const monthlyPnL = {};

  sortedMonths.forEach((yearMonth, index) => {
    console.log(`\n=== Processing ${yearMonth} ===`);
    
    const currentMonthData = dataByMonth[yearMonth];
    const currentMonthEnd = currentMonthData.lastNav;
    console.log(`Month end NAV: ${currentMonthEnd}`);

    let startNav;
    let startDate;
    if (index === 0) {
      // For first month, use its first available NAV
      startNav = currentMonthData.points[0].nav;
      startDate = currentMonthData.points[0].date;
      console.log(`First month - using first day's NAV as start: ${startNav}`);
    } else {
      // For subsequent months, use previous month's last available NAV
      const previousMonth = sortedMonths[index - 1];
      startNav = dataByMonth[previousMonth].lastNav;
      startDate = dataByMonth[previousMonth].lastDate;
      console.log(`Using previous month (${previousMonth}) last NAV as start: ${startNav}`);
    }

    const pnl = ((currentMonthEnd - startNav) / startNav) * 100;
    console.log(`PnL Calculation: ((${currentMonthEnd} - ${startNav}) / ${startNav}) * 100 = ${pnl.toFixed(2)}%`);

    monthlyPnL[yearMonth] = {
      startDate: startDate,
      endDate: currentMonthData.lastDate,
      startNav,
      endNav: currentMonthEnd,
      pnl,
      navPoints: currentMonthData.points
    };
  });

  console.log('\n=== Monthly PnL Results ===');
  Object.entries(monthlyPnL).forEach(([month, data]) => {
    console.log(`\n${month}:`);
    console.log(`  Start Date: ${data.startDate}`);
    console.log(`  End Date: ${data.endDate}`);
    console.log(`  Start NAV: ${data.startNav}`);
    console.log(`  End NAV: ${data.endNav}`);
    console.log(`  PnL: ${data.pnl.toFixed(2)}%`);
    console.log(`  NAV Points: ${data.navPoints.length}`);
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
        select: {
          date: true,
          account_tag: true,
          account_names: true,
          nav: true,
          portfolio_value: true,
          daily_pl: true,
        },
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
        
        // For AC5 Scheme B, override the metrics name to exclude "Zerodha"
        const metricsName =
          accountCode === "AC5" && scheme === "Scheme B"
            ? "Sarla Performance fibers Total Portfolio B"
            : portfolioNames.metrics;
        
        const metricsData = masterSheetData.filter(
          (entry) => entry.account_names === metricsName
        );
        
        const cashForScheme = cashInOutData.filter(
          (entry) => entry.account_code === accountCode && entry.scheme === scheme
        );

        const investedAmount = cashForScheme.reduce((sum, entry) => {
          const capitalAmount = entry.capital_in_out || 0;
          return sum + capitalAmount;
        }, 0);

        schemeInvestedAmounts[scheme] = investedAmount;

        const navCurve = metricsData.map((e) => ({
          date: e.date,
          nav: e.nav,
        }));

        const drawdownMetrics = calculateDrawdownMetrics(navCurve);

        // Use metricsData for totalProfit if it's AC5 Scheme B
        const totalProfit =
          accountCode === "AC5" && scheme === "Scheme B"
            ? calculateTotalProfit(metricsData, cashForScheme)
            : calculateTotalProfit(currentData, cashForScheme);

        // Calculate trailing returns:
        // - For Scheme A, include the 3y period (default periods)
        // - For all other schemes, calculate without the 3y period.
        let trailingReturns;
        if (scheme === "Scheme A") {
          trailingReturns = calculateTrailingReturns(navCurve);
        } else {
          trailingReturns = calculateTrailingReturns(navCurve, {
            "5d": 5,
            "10d": 10,
            "15d": 15,
            "1m": 30,
            "1y": 366,
            "2y": 731,
          });
        }

        results[accountCode].schemes[scheme] = {
          currentPortfolioValue:
            currentData.length > 0
              ? currentData[currentData.length - 1].portfolio_value || 0
              : 0,
          investedAmount,
          returns: calculateReturns(navCurve, cashForScheme),
          trailingReturns,
          monthlyPnL: calculateMonthlyPnL(navCurve),
          navCurve,
          totalProfit,
          dividends: cashForScheme.reduce(
            (sum, flow) => sum + (flow.dividend || 0),
            0
          ),
          currentDrawdown: drawdownMetrics.currentDD,
          maxDrawdown: drawdownMetrics.mdd,
          drawdownCurve: drawdownMetrics.ddCurve,
          cashFlows: cashForScheme.map((flow) => ({
            date: flow.date,
            amount: flow.capital_in_out,
            dividend: flow.dividend,
          })),
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
      const totalCashFlows = cashInOutData.filter(
        (entry) => entry.account_code === accountCode
      );

      const totalInvestedAmount = Object.values(schemeInvestedAmounts)
        .reduce((sum, amount) => sum + amount, 0);

      const totalNavCurve = totalMetricsData.map((e) => ({
        date: e.date,
        nav: e.nav
      }));

      const totalDrawdownMetrics = calculateDrawdownMetrics(totalNavCurve);
      const totalPortfolioProfit = calculateTotalProfit(totalCurrentData, totalCashFlows);

      results[accountCode].totalPortfolio = {
        currentPortfolioValue: totalCurrentData.length > 0
          ? totalCurrentData[totalCurrentData.length - 1].portfolio_value || 0
          : 0,
        investedAmount: totalInvestedAmount,
        returns: calculateReturns(totalNavCurve),
        // For totalPortfolio we always include the 3y period (default)
        trailingReturns: calculateTrailingReturns(totalNavCurve),
        monthlyPnL: calculateMonthlyPnL(totalNavCurve),
        navCurve: totalNavCurve,
        totalProfit: totalPortfolioProfit,
        dividends: totalCashFlows.reduce((sum, flow) => sum + (flow.dividend || 0), 0),
        currentDrawdown: totalDrawdownMetrics.currentDD,
        maxDrawdown: totalDrawdownMetrics.mdd,
        drawdownCurve: totalDrawdownMetrics.ddCurve,
        schemeAllocation: calculateSchemeAllocation(schemeInvestedAmounts),
        cashFlows: totalCashFlows.map(flow => ({
          date: flow.date,
          scheme: flow.scheme,
          amount: flow.capital_in_out,
          dividend: flow.dividend
        }))
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
