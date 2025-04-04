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
    "Scheme QAW": {
      current: "Sarla Performance fibers Zerodha Total Portfolio QAW",
      metrics: "Sarla Performance fibers Zerodha Total Portfolio QAW"
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
  // AC9: {
  //   "Scheme B": {
  //     current: "Deepti Parikh Zerodha Total Portfolio",
  //     metrics: "Deepti Parikh Total Portfolio B"
  //   },
  //   "_total": {
  //     current: "Deepti Parikh Zerodha Total Portfolio",
  //     metrics: "Deepti Parikh Total Portfolio B"
  //   }
  // }
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
    // // console.log("Insufficient NAV data points");
    return 0;
  }

  // // // console.log(cashInflow)

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
  },
  accountCode = null,
  scheme = null
) {
  if (!navData || navData.length === 0) return {};

  // Sort data so that the most recent date is first.
  const sortedData = [...navData].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const lastNav = sortedData[0].nav;
  const currentDate = new Date(sortedData[0].date);
  const returns = {};

  // Helper: find an entry matching a given date (YYYY-MM-DD), checking up to maxDaysBack days
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
    // For period "3y", calculate only if accountCode is "AC5" and scheme is "Scheme A"
    if (period === "3y" && (accountCode !== "AC5" || scheme !== "Scheme A")) {
      returns[period] = null;
      return; // Skip further calculation for "3y"
    }

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
        targetDate.setDate(targetDate.getDate() - 1);
        // console.log("targetDate", targetDate);
        // console.log("currentDate", currentDate);
      } else if (period === "1y") {
        targetDate.setFullYear(targetDate.getFullYear() - 1);
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
          const actualPeriodInYears =
            (currentDate - candidateDate) / (365 * 24 * 60 * 60 * 1000);
          const annualizedReturn =
            Math.pow(lastNav / candidate.nav, 1 / actualPeriodInYears) - 1;
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
  // // console.log('\n=== Starting PnL Calculation ===');
  // // console.log('Input data:', JSON.stringify(navData, null, 2));

  if (!navData || navData.length === 0) {
    // // console.log('No data provided or empty array');
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
      // // console.log(`\nCreating new month bucket for ${yearMonth}`);
    }

    acc[yearMonth].points.push({
      date: entry.date,
      nav: entry.nav
    });

    // Always update last NAV and date as we want the latest available
    acc[yearMonth].lastNav = entry.nav;
    acc[yearMonth].lastDate = entry.date;

    // // console.log(`Added to ${yearMonth}: Date=${entry.date}, NAV=${entry.nav}`);
    return acc;
  }, {});

  // // console.log('\n=== Data Grouped By Month ===');
  // // console.log(JSON.stringify(dataByMonth, null, 2));

  const sortedMonths = Object.keys(dataByMonth).sort();
  // // console.log('\nSorted months:', sortedMonths);

  const monthlyPnL = {};

  sortedMonths.forEach((yearMonth, index) => {
    // // console.log(`\n=== Processing ${yearMonth} ===`);

    const currentMonthData = dataByMonth[yearMonth];
    const currentMonthEnd = currentMonthData.lastNav;
    // // console.log(`Month end NAV: ${currentMonthEnd}`);

    let startNav;
    let startDate;
    if (index === 0) {
      // For first month, use its first available NAV
      startNav = currentMonthData.points[0].nav;
      startDate = currentMonthData.points[0].date;
      // // console.log(`First month - using first day's NAV as start: ${startNav}`);
    } else {
      // For subsequent months, use previous month's last available NAV
      const previousMonth = sortedMonths[index - 1];
      startNav = dataByMonth[previousMonth].lastNav;
      startDate = dataByMonth[previousMonth].lastDate;
      // // console.log(`Using previous month (${previousMonth}) last NAV as start: ${startNav}`);
    }

    const pnl = ((currentMonthEnd - startNav) / startNav) * 100;
    // // console.log(`PnL Calculation: ((${currentMonthEnd} - ${startNav}) / ${startNav}) * 100 = ${pnl.toFixed(2)}%`);

    monthlyPnL[yearMonth] = {
      startDate: startDate,
      endDate: currentMonthData.lastDate,
      startNav,
      endNav: currentMonthEnd,
      pnl,
      navPoints: currentMonthData.points
    };
  });

  // // console.log('\n=== Monthly PnL Results ===');
  Object.entries(monthlyPnL).forEach(([month, data]) => {
    // // console.log(`\n${month}:`);
    // // console.log(`  Start Date: ${data.startDate}`);
    // // console.log(`  End Date: ${data.endDate}`);
    // // console.log(`  Start NAV: ${data.startNav}`);
    // // console.log(`  End NAV: ${data.endNav}`);
    // // console.log(`  PnL: ${data.pnl.toFixed(2)}%`);
    // // console.log(`  NAV Points: ${data.navPoints.length}`);
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
function calculateQuarterlyPnLWithDailyPL(navData, cashFlows = [], portfolioValues = [], scheme) {
  if (!navData || navData.length === 0) {
    console.warn("No NAV data provided.");
    return {};
  }

  const getQuarter = (month) => {
    if (month < 3) return 'Q1';
    if (month < 6) return 'Q2';
    if (month < 9) return 'Q3';
    return 'Q4';
  };

  const getFirstMonthOfQuarter = (quarterName) => {
    switch (quarterName) {
      case 'Q1': return 0;
      case 'Q2': return 3;
      case 'Q3': return 6;
      case 'Q4': return 9;
      default: return 0;
    }
  };

  // --- NAV-Based Data ---
  const dataByQuarter = navData.reduce((acc, entry) => {
    const date = new Date(entry.date);
    const year = date.getFullYear();
    const quarter = getQuarter(date.getMonth());
    const yearQuarter = `${year}-${quarter}`;

    if (!acc[yearQuarter]) {
      acc[yearQuarter] = {
        points: [],
        lastNav: null,
        lastDate: null,
        firstDate: entry.date,
      };
    }

    acc[yearQuarter].points.push({
      date: entry.date,
      nav: entry.nav,
    });

    acc[yearQuarter].lastNav = entry.nav;
    acc[yearQuarter].lastDate = entry.date;

    if (new Date(entry.date) < new Date(acc[yearQuarter].firstDate)) {
      acc[yearQuarter].firstDate = entry.date;
    }

    return acc;
  }, {});

  // Filter portfolio values based on scheme
  const filteredPortfolioValues = scheme === "Sarla Performance fibers Total Portfolio B"
    ? portfolioValues.filter(item =>
      item.account_names === "Sarla Performance fibers Total Portfolio B" &&
      item.daily_pl !== undefined &&
      item.daily_pl !== null
    )
    : portfolioValues;

  // Sort portfolio values by date
  const sortedPortfolioValues = [...filteredPortfolioValues].sort((a, b) =>
    new Date(a.date) - new Date(b.date)
  );

  // Group daily PL values by quarter directly
  const groupDailyPLByQuarter = () => {
    const result = {};

    sortedPortfolioValues.forEach(entry => {
      if (entry.daily_pl === undefined || entry.daily_pl === null) return;

      const date = new Date(entry.date);
      const year = date.getFullYear();
      const quarter = getQuarter(date.getMonth());
      const yearQuarter = `${year}-${quarter}`;

      if (!result[yearQuarter]) {
        result[yearQuarter] = {
          values: [],
          totalPL: 0,
          startDate: entry.date,
          endDate: entry.date
        };
      }

      result[yearQuarter].values.push({
        date: entry.date,
        value: entry.daily_pl
      });

      result[yearQuarter].totalPL += entry.daily_pl;

      if (new Date(entry.date) < new Date(result[yearQuarter].startDate)) {
        result[yearQuarter].startDate = entry.date;
      }
      if (new Date(entry.date) > new Date(result[yearQuarter].endDate)) {
        result[yearQuarter].endDate = entry.date;
      }
    });

    return result;
  };

  const dailyPLByQuarter = groupDailyPLByQuarter();

  // Helper function to find value from first month of quarter
  const findValueFromFirstMonth = (yearQuarter) => {
    const [year, quarter] = yearQuarter.split('-');
    const firstMonthOfQuarter = getFirstMonthOfQuarter(quarter);

    const entriesInFirstMonth = sortedPortfolioValues.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getFullYear() === parseInt(year) &&
        entryDate.getMonth() === firstMonthOfQuarter;
    });

    if (entriesInFirstMonth.length > 0) {
      const earliestEntry = entriesInFirstMonth[0];
      return {
        date: new Date(earliestEntry.date).toISOString().slice(0, 10),
        value: earliestEntry.portfolio_value || 0,
        dailyPL: earliestEntry.daily_pl || 0
      };
    }

    const quarterStartDate = new Date(parseInt(year), firstMonthOfQuarter, 1);
    const laterEntries = sortedPortfolioValues.filter(entry =>
      new Date(entry.date) >= quarterStartDate
    );

    if (laterEntries.length > 0) {
      const closestEntry = laterEntries[0];
      return {
        date: new Date(closestEntry.date).toISOString().slice(0, 10),
        value: closestEntry.portfolio_value || 0,
        dailyPL: closestEntry.daily_pl || 0
      };
    }

    return {
      date: quarterStartDate.toISOString().slice(0, 10),
      value: 0,
      dailyPL: 0
    };
  };

  // Helper function to find closest value for date
  const findClosestValueForDate = (targetDate, useLatestFromMonth = true) => {
    const targetDateObj = new Date(targetDate);

    if (useLatestFromMonth) {
      const targetYear = targetDateObj.getFullYear();
      const targetMonth = targetDateObj.getMonth();

      const sameMonthEntries = sortedPortfolioValues.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getFullYear() === targetYear &&
          entryDate.getMonth() === targetMonth &&
          entryDate <= targetDateObj;
      });

      if (sameMonthEntries.length > 0) {
        const latestEntry = sameMonthEntries[sameMonthEntries.length - 1];
        return {
          date: new Date(latestEntry.date).toISOString().slice(0, 10),
          value: latestEntry.portfolio_value || 0,
          dailyPL: latestEntry.daily_pl || 0
        };
      }
    }

    const earlierEntries = sortedPortfolioValues.filter(entry =>
      new Date(entry.date) <= targetDateObj
    );

    if (earlierEntries.length > 0) {
      const closestEntry = earlierEntries[earlierEntries.length - 1];
      return {
        date: new Date(closestEntry.date).toISOString().slice(0, 10),
        value: closestEntry.portfolio_value || 0,
        dailyPL: closestEntry.daily_pl || 0
      };
    }

    return {
      date: targetDate,
      value: 0,
      dailyPL: 0
    };
  };

  const sortedQuarters = Object.keys(dataByQuarter).sort();
  const quarterlyPnL = {};

  // console.log("🧮 Calculating Quarterly PnL...");
  // console.log("🗓 Sorted Quarters:", sortedQuarters);

  sortedQuarters.forEach((yearQuarter, index) => {
    const currentData = dataByQuarter[yearQuarter];
    const currentQuarterEnd = currentData.lastNav;
    let startNav, startDate;

    if (index === 0) {
      startNav = currentData.points[0].nav;
      startDate = currentData.points[0].date;
    } else {
      const previousQuarter = sortedQuarters[index - 1];
      startNav = dataByQuarter[previousQuarter].lastNav;
      startDate = dataByQuarter[previousQuarter].lastDate;
    }

    const navPnLPercent = ((currentQuarterEnd - startNav) / startNav) * 100;

    const startDateInfo = findValueFromFirstMonth(yearQuarter);
    const endDateInfo = findClosestValueForDate(currentData.lastDate, true);

    const startVal = startDateInfo.value;
    const endVal = endDateInfo.value;

    // Use grouped daily PL data instead of recalculating
    const plData = dailyPLByQuarter[yearQuarter] || { totalPL: 0, values: [] };
    const totalDailyPnL = plData.totalPL;

    // console.log(`📊 Quarter: ${yearQuarter}`);
    // console.log(`   ➤ Start NAV: ${startNav}`);
    // console.log(`   ➤ End NAV: ${currentQuarterEnd}`);
    // console.log(`   ➤ NAV % PnL: ${navPnLPercent.toFixed(2)}%`);
    // console.log(`   ➤ Start Value: ${startVal} (from ${startDateInfo.date})`);
    // console.log(`   ➤ End Value: ${endVal} (from ${endDateInfo.date})`);
    // console.log(`   ➤ Daily PL Sum: ${totalDailyPnL}`);
    // console.log(`   ➤ NAV Points Count: ${currentData.points.length}`);

    quarterlyPnL[yearQuarter] = {
      startDate,
      endDate: currentData.lastDate,
      startNav,
      endNav: currentQuarterEnd,
      navPnLPercent,
      navPoints: currentData.points,
      startValue: startVal,
      endValue: endVal,
      valueStartDate: startDateInfo.date,
      valueEndDate: endDateInfo.date,
      cashPnL: totalDailyPnL,
      dailyPnLValues: plData.values // Added from new logic
    };
  });

  // Calculate total PL across all quarters
  const totalPLAllQuarters = Object.values(dailyPLByQuarter)
    .reduce((sum, quarter) => sum + quarter.totalPL, 0);
  const directSum = sortedPortfolioValues.reduce((sum, item) =>
    sum + (item.daily_pl || 0), 0);

  // console.log("\n📊 Total Daily PL across all quarters:", totalPLAllQuarters);
  // console.log("📊 Direct sum of all daily_pl values:", directSum);

  return {
    byQuarter: quarterlyPnL,
    totalPL: totalPLAllQuarters,
    directSum
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


async function fetchUserMasterDetails(userId) {
  const userDetails = await prisma.user_master.findUnique({
    where: { id: userId },
    include: {
      client_master: true,
    },
  });
  return userDetails;
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    let user_id = Number(session?.user?.user_id);
    const view_type = searchParams.get("view_type");

    if (view_type === "account") {
      const userMasterDetails = await fetchUserMasterDetails(user_id);
      return NextResponse.json(
        {
          view_type: "account",
          userMasterDetails,
        },
        { status: 200 }
      );
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.max(
      1,
      parseInt(searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE))
    );

    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: "Valid user ID is required" },
        { status: 400 }
      );
    }

    const managedAccounts = await prisma.managed_account_clients.findMany({
      where: { id: parseInt(userId) },
      select: { account_code: true },
    });

    const accountCodes = managedAccounts.map((account) => account.account_code);
    if (accountCodes.length === 0) {
      return NextResponse.json(
        {
          error: "No accounts found for the user",
          userId,
        },
        { status: 404 }
      );
    }

    const [cashInOutData, masterSheetData, deeptiMasterSheetData, portfolioMasterData] = await Promise.all([
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
        where: { account_tag: { in: accountCodes.filter(code => code !== "AC9") } },
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
      accountCodes.includes("AC9")
  ? prisma.deepti_master_sheet.findMany({
      where: {
        system_tag: "Total Portfolio Value", // Filter directly in the query
      },
      select: {
        date: true,
        nav: true,
        portfolio_value: true,
        drawdown: true,
        daily_p_l: true,
        system_tag: true, // Optional, for debugging
      },
      orderBy: { date: "asc" },
    })
  : Promise.resolve([]),
      prisma.managed_portfolio_master.findMany({
        where: { account_code: { in: accountCodes } },
        select: {
          account_code: true,
          scheme: true,
          current_portfolio_value: true,
          total_profit: true,
          returns: true,
        },
      }),
    ]);

    const results = {};
    const globalSchemeInvestedAmounts = {};

    for (const accountCode of accountCodes) {
      if (accountCode === "AC9") {
        // 1) Find Deepti's row(s) from managed_portfolio_master
        //    We'll assume "Scheme B" for her main scheme, and "Scheme Total" if you want it separate.
        const portfolioMasterAC9SchemeB = portfolioMasterData.find(
          (row) => row.account_code === "AC9" && row.scheme === "Scheme B"
        );
        const portfolioMasterAC9Total = portfolioMasterData.find(
          (row) => row.account_code === "AC9" && row.scheme === "Scheme Total"
        );
      
        // 2) Filter deeptiMasterSheet using system_tag = "Total Portfolio Value"
        const filteredDeeptiData = deeptiMasterSheetData.filter(
          (e) => e.system_tag === "Total Portfolio Value"
        );
      
        // 3) Build navCurve
        const navData = filteredDeeptiData.map((e) => ({
          date: e.date,
          nav: e.nav || 0,
        }));
        // Sort by ascending date (to avoid zigzag lines)
        const navCurve = navData.sort((a, b) => new Date(a.date) - new Date(b.date));
      
        // 4) Calculate your fallback (manual) metrics if needed
        const cashForAC9 = cashInOutData.filter((entry) => entry.account_code === "AC9");
        const fallbackTotalProfit = calculateTotalProfit(filteredDeeptiData, cashForAC9) || 0;
        const fallbackReturns = calculateReturns(navCurve, cashForAC9) || 0;
        const fallbackPortfolioValue =
          filteredDeeptiData.length > 0
            ? filteredDeeptiData[filteredDeeptiData.length - 1].portfolio_value || 0
            : 0;
      
        // 5) AC9 "Scheme B" portfolio metrics from managed_portfolio_master
        const schemeCurrentPortfolioValue = portfolioMasterAC9SchemeB
          ? portfolioMasterAC9SchemeB.current_portfolio_value
          : fallbackPortfolioValue;
      
        const schemeReturns = portfolioMasterAC9SchemeB
          ? portfolioMasterAC9SchemeB.returns
          : fallbackReturns; // If not found in DB, fallback to manual calculation
      
        const schemeTotalProfit = portfolioMasterAC9SchemeB
          ? portfolioMasterAC9SchemeB.total_profit
          : fallbackTotalProfit;
      
        const investedAmount = cashForAC9.reduce(
          (sum, entry) => sum + (entry.capital_in_out || 0),
          0
        );
      
        // 6) Drawdown metrics, monthly/quarterly PnL, etc.
        const drawdownMetrics = calculateDrawdownMetrics(navCurve);
        const drawdownCurveFromDB = filteredDeeptiData.map((row) => ({
          date: row.date,
          drawdown: (row.drawdown ?? 0), // fallback if null
        }));
      
        drawdownCurveFromDB.sort((a, b) => new Date(a.date) - new Date(b.date));
        // 7) Build the final AC9 result
        results[accountCode] = {
          clientName: "Deepti Parikh",
          schemes: {
            "Scheme B": {
              currentPortfolioValue: schemeCurrentPortfolioValue,
              investedAmount,
              returns: schemeReturns * 100, // multiplied by 100 if you want a "percent"
              trailingReturns: calculateTrailingReturns(navCurve, {
                "5d": 5,
                "10d": 10,
                "15d": 15,
                "1m": 30,
                "1y": 366,
                "2y": 731,
              }) || {},
              monthlyPnL: calculateMonthlyPnL(navCurve) || {},
              quarterlyPnL: calculateQuarterlyPnLWithDailyPL(
                navCurve,
                cashForAC9,
                filteredDeeptiData
              ) || {},
              navCurve,
              totalProfit: schemeTotalProfit,
              dividends: cashForAC9.reduce(
                (sum, flow) => sum + (flow.dividend || 0),
                0
              ),
              currentDrawdown: drawdownMetrics.currentDD || 0,
              maxDrawdown: drawdownMetrics.mdd || 0,
              drawdownCurve: (-drawdownCurveFromDB),
              cashFlows: cashForAC9.map((flow) => ({
                date: flow.date,
                amount: flow.capital_in_out || 0,
                dividend: flow.dividend || 0,
              })),
            },
          },
      
          // 8) For totalPortfolio, you can similarly get from "Scheme Total" row (if defined)
          totalPortfolio: {
            currentPortfolioValue: portfolioMasterAC9Total
              ? portfolioMasterAC9Total.current_portfolio_value
              : fallbackPortfolioValue,
            investedAmount,
            returns: portfolioMasterAC9Total
              ? portfolioMasterAC9Total.returns * 100
              : fallbackReturns * 100,
            trailingReturns: calculateTrailingReturns(navCurve) || {},
            quarterlyPnL: calculateQuarterlyPnLWithDailyPL(
              navCurve,
              cashForAC9,
              filteredDeeptiData
            ) || {},
            monthlyPnL: calculateMonthlyPnL(navCurve) || {},
            navCurve,
            totalProfit: portfolioMasterAC9Total
              ? portfolioMasterAC9Total.total_profit
              : fallbackTotalProfit,
            dividends: cashForAC9.reduce(
              (sum, flow) => sum + (flow.dividend || 0),
              0
            ),
            currentDrawdown: drawdownMetrics.currentDD || 0,
            maxDrawdown: drawdownMetrics.mdd || 0,
            drawdownCurve: (drawdownCurveFromDB), // UPDATED: Now using drawdownCurveFromDB instead of drawdownMetrics.ddCurve
            schemeAllocation: { "Scheme B": 100 },
            cashFlows: cashForAC9.map((flow) => ({
              date: flow.date,
              scheme: "Scheme B",
              amount: flow.capital_in_out || 0,
              dividend: flow.dividend || 0,
            })),
          },
        };
      }
       else {
        // Handle other accounts
        results[accountCode] = {
          clientName: CLIENT_NAMES[accountCode] || "Unknown Client",
          schemes: {},
          totalPortfolio: {},
        };

        const schemes = Object.keys(PORTFOLIO_MAPPING[accountCode] || {}).filter(
          (scheme) => scheme !== "_total"
        );
        const schemeInvestedAmounts = {};

        for (const scheme of schemes) {
          const portfolioNames = getPortfolioNames(accountCode, scheme);
          const currentData = masterSheetData.filter(
            (entry) => entry.account_names === portfolioNames.current
          );
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
          const investedAmount = cashForScheme.reduce((sum, entry) => sum + (entry.capital_in_out || 0), 0);
          schemeInvestedAmounts[scheme] = investedAmount;

          const navCurve = metricsData.map((e) => ({
            date: e.date,
            nav: e.nav,
          }));

          const drawdownMetrics = calculateDrawdownMetrics(navCurve);
          const calcTotalProfit =
            accountCode === "AC5" && scheme === "Scheme B"
              ? calculateTotalProfit(metricsData, cashForScheme)
              : calculateTotalProfit(currentData, cashForScheme);

          const portfolioMaster = portfolioMasterData.find(
            (row) => row.account_code === accountCode && row.scheme === scheme
          );
          const schemeCurrentPortfolioValue = portfolioMaster
            ? portfolioMaster.current_portfolio_value
            : currentData.length > 0
              ? currentData[currentData.length - 1].portfolio_value || 0
              : 0;
          const schemeTotalProfit = portfolioMaster
            ? portfolioMaster.total_profit
            : calcTotalProfit;
          const schemeReturns = portfolioMaster
            ? portfolioMaster.returns
            : calculateReturns(navCurve, cashForScheme);

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

          let quarterlyPnL;
          if (accountCode === "AC5" && scheme === "Scheme B") {
            quarterlyPnL = calculateQuarterlyPnLWithDailyPL(
              navCurve,
              cashForScheme,
              metricsData,
              "Sarla Performance fibers Total Portfolio B"
            );
          } else {
            quarterlyPnL = calculateQuarterlyPnLWithDailyPL(
              navCurve,
              cashForScheme,
              currentData
            );
          }

          results[accountCode].schemes[scheme] = {
            currentPortfolioValue: schemeCurrentPortfolioValue,
            investedAmount,
            returns: schemeReturns * 100,
            trailingReturns,
            monthlyPnL: calculateMonthlyPnL(navCurve),
            quarterlyPnL,
            navCurve,
            totalProfit: schemeTotalProfit,
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

        // Process total portfolio metrics for non-AC9 accounts
        if (PORTFOLIO_MAPPING[accountCode] && PORTFOLIO_MAPPING[accountCode]._total) {
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
          const totalInvestedAmount = Object.values(schemeInvestedAmounts).reduce(
            (sum, amount) => sum + amount,
            0
          );
          const totalNavCurve = totalMetricsData.map((e) => ({
            date: e.date,
            nav: e.nav,
          }));
          const totalDrawdownMetrics = calculateDrawdownMetrics(totalNavCurve);
          const calcTotalPortfolioProfit = calculateTotalProfit(
            totalCurrentData,
            totalCashFlows
          );

          const portfolioMasterTotal = portfolioMasterData.find(
            (row) => row.account_code === accountCode && row.scheme === "Scheme Total"
          );
          const totalPortfolioValue = portfolioMasterTotal
            ? portfolioMasterTotal.current_portfolio_value
            : totalCurrentData.length > 0
              ? totalCurrentData[totalCurrentData.length - 1].portfolio_value || 0
              : 0;
          const totalProfitValue = portfolioMasterTotal
            ? portfolioMasterTotal.total_profit
            : calcTotalPortfolioProfit;

          results[accountCode].totalPortfolio = {
            currentPortfolioValue: totalPortfolioValue,
            investedAmount: totalInvestedAmount,
            returns: portfolioMasterTotal
              ? portfolioMasterTotal.returns * 100
              : calculateReturns(totalNavCurve, totalCashFlows),
            trailingReturns: calculateTrailingReturns(totalNavCurve),
            quarterlyPnL: calculateQuarterlyPnLWithDailyPL(totalNavCurve, totalCashFlows, totalCurrentData),
            monthlyPnL: calculateMonthlyPnL(totalNavCurve),
            navCurve: totalNavCurve,
            totalProfit: totalProfitValue,
            dividends: totalCashFlows.reduce(
              (sum, flow) => sum + (flow.dividend || 0),
              0
            ),
            currentDrawdown: totalDrawdownMetrics.currentDD,
            maxDrawdown: totalDrawdownMetrics.mdd,
            drawdownCurve: totalDrawdownMetrics.ddCurve,
            schemeAllocation: calculateSchemeAllocation(schemeInvestedAmounts),
            cashFlows: totalCashFlows.map((flow) => ({
              date: flow.date,
              scheme: flow.scheme,
              amount: flow.capital_in_out,
              dividend: flow.dividend,
            })),
          };
        }
      }
    }

    // Process holdings only for non-AC9 accounts
    const sessionManagedAccountCodes = session?.user?.managed_account_codes || accountCodes.filter(code => code !== "AC9");
    const holdingsData = await prisma.managed_accounts_holdings.findMany({
      where: { account_code: { in: sessionManagedAccountCodes } },
    });
    const groupedByScheme = holdingsData.reduce((acc, holding) => {
      const { scheme, stock, sell_price, qty, type } = holding;
      const numericSellPrice = Number(sell_price);
      const numericQty = Number(qty);
      const allocation = numericSellPrice * numericQty;
      if (!acc[scheme]) {
        acc[scheme] = { stock: {}, MF: {} };
      }
      if (!acc[scheme][type]) {
        acc[scheme][type] = {};
      }
      if (!acc[scheme][type][stock]) {
        acc[scheme][type][stock] = {
          stock,
          totalQty: 0,
          totalSellPrice: 0,
          totalAllocation: 0,
        };
      }
      acc[scheme][type][stock].totalQty += numericQty;
      acc[scheme][type][stock].totalSellPrice += numericSellPrice;
      acc[scheme][type][stock].totalAllocation += allocation;
      if (!acc["totalPortfolio"]) {
        acc["totalPortfolio"] = { stock: {}, MF: {} };
      }
      if (!acc["totalPortfolio"][type]) {
        acc["totalPortfolio"][type] = {};
      }
      if (!acc["totalPortfolio"][type][stock]) {
        acc["totalPortfolio"][type][stock] = {
          stock,
          totalQty: 0,
          totalSellPrice: 0,
          totalAllocation: 0,
        };
      }
      acc["totalPortfolio"][type][stock].totalQty += numericQty;
      acc["totalPortfolio"][type][stock].totalSellPrice += numericSellPrice;
      acc["totalPortfolio"][type][stock].totalAllocation += allocation;
      return acc;
    }, {});

    for (const scheme in groupedByScheme) {
      for (const type in groupedByScheme[scheme]) {
        const stocks = groupedByScheme[scheme][type];
        const denominator = Object.values(stocks).reduce(
          (sum, { totalAllocation }) => sum + totalAllocation,
          0
        );
        for (const stock in stocks) {
          stocks[stock].percentage = denominator
            ? (stocks[stock].totalAllocation / denominator) * 100
            : 0;
        }
      }
    }

    return NextResponse.json(
      {
        data: {
          accounts: results,
          holdings: groupedByScheme,
        },
        pagination: {
          page,
          pageSize,
          totalAccounts: accountCodes.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Portfolio API Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Keep all other functions (calculateTotalProfit, calculateDrawdownMetrics, etc.) unchanged
