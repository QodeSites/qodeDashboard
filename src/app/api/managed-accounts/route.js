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
  AC9: {
    "Scheme B": {
      current: "Deepti Parikh Zerodha Total Portfolio",
      metrics: "Deepti Parikh Total Portfolio B"
    },
    "_total": {
      current: "Deepti Parikh Zerodha Total Portfolio",
      metrics: "Deepti Parikh Total Portfolio B"
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
    // console.log("Insufficient NAV data points");
    return 0;
  }

  // // console.log(cashInflow)

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
        console.log("targetDate", targetDate);
        console.log("currentDate", currentDate);
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
  // console.log('\n=== Starting PnL Calculation ===');
  // console.log('Input data:', JSON.stringify(navData, null, 2));

  if (!navData || navData.length === 0) {
    // console.log('No data provided or empty array');
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
      // console.log(`\nCreating new month bucket for ${yearMonth}`);
    }

    acc[yearMonth].points.push({
      date: entry.date,
      nav: entry.nav
    });

    // Always update last NAV and date as we want the latest available
    acc[yearMonth].lastNav = entry.nav;
    acc[yearMonth].lastDate = entry.date;

    // console.log(`Added to ${yearMonth}: Date=${entry.date}, NAV=${entry.nav}`);
    return acc;
  }, {});

  // console.log('\n=== Data Grouped By Month ===');
  // console.log(JSON.stringify(dataByMonth, null, 2));

  const sortedMonths = Object.keys(dataByMonth).sort();
  // console.log('\nSorted months:', sortedMonths);

  const monthlyPnL = {};

  sortedMonths.forEach((yearMonth, index) => {
    // console.log(`\n=== Processing ${yearMonth} ===`);

    const currentMonthData = dataByMonth[yearMonth];
    const currentMonthEnd = currentMonthData.lastNav;
    // console.log(`Month end NAV: ${currentMonthEnd}`);

    let startNav;
    let startDate;
    if (index === 0) {
      // For first month, use its first available NAV
      startNav = currentMonthData.points[0].nav;
      startDate = currentMonthData.points[0].date;
      // console.log(`First month - using first day's NAV as start: ${startNav}`);
    } else {
      // For subsequent months, use previous month's last available NAV
      const previousMonth = sortedMonths[index - 1];
      startNav = dataByMonth[previousMonth].lastNav;
      startDate = dataByMonth[previousMonth].lastDate;
      // console.log(`Using previous month (${previousMonth}) last NAV as start: ${startNav}`);
    }

    const pnl = ((currentMonthEnd - startNav) / startNav) * 100;
    // console.log(`PnL Calculation: ((${currentMonthEnd} - ${startNav}) / ${startNav}) * 100 = ${pnl.toFixed(2)}%`);

    monthlyPnL[yearMonth] = {
      startDate: startDate,
      endDate: currentMonthData.lastDate,
      startNav,
      endNav: currentMonthEnd,
      pnl,
      navPoints: currentMonthData.points
    };
  });

  // console.log('\n=== Monthly PnL Results ===');
  Object.entries(monthlyPnL).forEach(([month, data]) => {
    // console.log(`\n${month}:`);
    // console.log(`  Start Date: ${data.startDate}`);
    // console.log(`  End Date: ${data.endDate}`);
    // console.log(`  Start NAV: ${data.startNav}`);
    // console.log(`  End NAV: ${data.endNav}`);
    // console.log(`  PnL: ${data.pnl.toFixed(2)}%`);
    // console.log(`  NAV Points: ${data.navPoints.length}`);
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

function calculateQuarterlyPnLWithDailyPL(navData, cashFlows = [], portfolioValues = []) {
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
  
  // Sort portfolio values by date for finding the closest value
  const sortedPortfolioValues = [...portfolioValues].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
  
  // IMPORTANT: Instead of finding daily PL values based on NAV dates,
  // we should use all available daily PL values directly
  const groupDailyPLByQuarter = () => {
    // Initialize the result object
    const result = {};
    
    // Process each portfolio value
    sortedPortfolioValues.forEach(entry => {
      // Skip entries without daily_pl
      if (entry.daily_pl === undefined || entry.daily_pl === null) return;
      
      const date = new Date(entry.date);
      const year = date.getFullYear();
      const quarter = getQuarter(date.getMonth());
      const yearQuarter = `${year}-${quarter}`;
      
      // Create the quarter entry if it doesn't exist
      if (!result[yearQuarter]) {
        result[yearQuarter] = {
          values: [],
          totalPL: 0,
          startDate: entry.date,
          endDate: entry.date
        };
      }
      
      // Add the daily PL value to this quarter
      result[yearQuarter].values.push({
        date: entry.date,
        value: entry.daily_pl
      });
      
      // Update the total
      result[yearQuarter].totalPL += entry.daily_pl;
      
      // Update first and last dates
      if (new Date(entry.date) < new Date(result[yearQuarter].startDate)) {
        result[yearQuarter].startDate = entry.date;
      }
      if (new Date(entry.date) > new Date(result[yearQuarter].endDate)) {
        result[yearQuarter].endDate = entry.date;
      }
    });
    
    return result;
  };
  
  // Group daily PL values by quarter directly
  const dailyPLByQuarter = groupDailyPLByQuarter();
  
  // Process NAV data by quarter (for reference only)
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
    
    // Update last values
    acc[yearQuarter].lastNav = entry.nav;
    acc[yearQuarter].lastDate = entry.date;
    
    // Keep track of first date if this is earlier
    if (new Date(entry.date) < new Date(acc[yearQuarter].firstDate)) {
      acc[yearQuarter].firstDate = entry.date;
    }
    
    return acc;
  }, {});
  
  // For testing with the provided values
  const testDailyPLValues = [
    216928.5, -474036, 455852.3, 75234.2, -132245, -362055, -590743, -519496, 55174.62, 73735.64,
    350149.5, 84096.22, -92851.9, -117008, 135938.9, -536875, -258283, 122033.2, 175507.3, 185176.3,
    -208332, 44418.96, -5628.91, -87397.7, -340040, -523971, 10934.07, 42603.1, -376962, -108280,
    -295423, 120614.1, -164835, 69666.83, 759628.3, 97159.17, 239894.6, 104087.9, 369682.5, 335806.2,
    141318.9, 90828.48, -282975, -304469, 266612.1, 351263.2, 241822.9, 259200.2, -148467, 467373.2,
    15583.45, 123845.1, -360785, 134341.3, -525141, -183199, 635442.8, 186983.6, 124296.2, 54548.41, -41587.7
  ];
  
  // Calculate correct sum of the test values
  const testSum = testDailyPLValues.reduce((sum, value) => sum + value, 0);
  console.log("Test Sum of Provided Values:", testSum);
  
  // Get all quarters from both NAV and daily PL data
  const allQuarters = new Set([
    ...Object.keys(dataByQuarter),
    ...Object.keys(dailyPLByQuarter)
  ]);
  const sortedQuarters = [...allQuarters].sort();
  
  console.log("🧮 Calculating Quarterly PnL...");
  console.log("🗓 Sorted Quarters:", sortedQuarters);
  
  // Create the final result
  const quarterlyPnL = {};
  let totalPLAllQuarters = 0;
  
  sortedQuarters.forEach(yearQuarter => {
    const navData = dataByQuarter[yearQuarter] || {
      startDate: "N/A",
      lastDate: "N/A",
      points: [],
      firstDate: "N/A",
      lastNav: 0
    };
    
    const plData = dailyPLByQuarter[yearQuarter] || {
      values: [],
      totalPL: 0,
      startDate: "N/A",
      endDate: "N/A"
    };
    
    // Get first and last daily PL values with their dates
    const startDailyPL = plData.values.length > 0 ? plData.values[0].value : 0;
    const startDailyPLDate = plData.values.length > 0 ? plData.values[0].date : 'N/A';
    
    const endDailyPL = plData.values.length > 0 ? plData.values[plData.values.length - 1].value : 0;
    const endDailyPLDate = plData.values.length > 0 ? plData.values[plData.values.length - 1].date : 'N/A';
    
    // Count the total number of daily PL values for this quarter
    const dailyPLCount = plData.values.length;
    
    // Debug Logs for Each Quarter
    console.log(`📊 Quarter: ${yearQuarter}`);
    console.log(`   ➤ Start NAV: ${navData.points[0]?.nav || "N/A"}`);
    console.log(`   ➤ End NAV: ${navData.lastNav || "N/A"}`);
    console.log(`   ➤ Start Daily PL: ${startDailyPL} [${startDailyPLDate}]`);
    console.log(`   ➤ End Daily PL: ${endDailyPL} [${endDailyPLDate}]`);
    console.log(`   ➤ Daily PL Sum: ${plData.totalPL}`);
    console.log(`   ➤ Daily PL Count: ${dailyPLCount}`);
    
    // Check for any values close to zero in the daily PL values (might indicate a rounding issue)
    const verySmallValues = plData.values.filter(v => Math.abs(v.value) < 0.0001 && v.value !== 0);
    if (verySmallValues.length > 0) {
      console.log(`   ⚠️ Found ${verySmallValues.length} very small values that might affect the sum`);
    }
    
    // Add this quarter's total to the running sum
    totalPLAllQuarters += plData.totalPL;
    
    // Store the results
    quarterlyPnL[yearQuarter] = {
      startDate: navData.firstDate,
      endDate: navData.lastDate,
      startNav: navData.points[0]?.nav || 0,
      endNav: navData.lastNav || 0,
      dailyPnLValues: plData.values,
      startDailyPL,
      startDailyPLDate,
      endDailyPL,
      endDailyPLDate,
      cashPnL: plData.totalPL,
      dailyPLCount
    };
  });
  
  // Print the total daily PL across all quarters
  console.log("\n📊 Total Daily PL across all quarters:", totalPLAllQuarters);
  
  // Print a direct sum of all portfolio values for comparison
  const directSum = sortedPortfolioValues.reduce((sum, item) => 
    sum + (item.daily_pl || 0), 0);
  console.log("📊 Direct sum of all daily_pl values:", directSum);
  
  // Print a summary of start and end daily PL values for all quarters
  console.log("\n📈 Summary of Daily PL Start and End Values:");
  Object.keys(quarterlyPnL).forEach(quarter => {
    console.log(`${quarter}:`);
    console.log(`   Start Daily PL: ${quarterlyPnL[quarter].startDailyPL} [${quarterlyPnL[quarter].startDailyPLDate}]`);
    console.log(`   End Daily PL: ${quarterlyPnL[quarter].endDailyPL} [${quarterlyPnL[quarter].endDailyPLDate}]`);
    console.log(`   Total Daily PL: ${quarterlyPnL[quarter].cashPnL}`);
    console.log(`   Daily PL Count: ${quarterlyPnL[quarter].dailyPLCount}`);
  });
  
  // Special test function to check if the provided array sums to expected value
  function testProvidedValues() {
    const values = testDailyPLValues;
    const sum = values.reduce((acc, val) => acc + val, 0);
    console.log("\n📌 TEST RESULTS:");
    console.log(`Total values in test array: ${values.length}`);
    console.log(`Sum of test array: ${sum}`);
    
    // Check if sum matches expected value
    const expectedSum = 176694;
    console.log(`Expected sum: ${expectedSum}`);
    console.log(`Difference: ${sum - expectedSum}`);
    
    // Print each value and its running sum for verification
    let runningSum = 0;
    console.log("\nRunning sum calculation:");
    values.forEach((val, index) => {
      runningSum += val;
      if (index < 5 || index > values.length - 6) {
        console.log(`Value ${index+1}: ${val}, Running Sum: ${runningSum}`);
      } else if (index === 5) {
        console.log("...");
      }
    });
  }
  
  // Run the test function
  testProvidedValues();
  
  return {
    byQuarter: quarterlyPnL,
    totalPL: totalPLAllQuarters,
    directSum
  };
}

// For testing specifically with the provided values
function testArraySum() {
  const testValues = [
    216928.5, -474036, 455852.3, 75234.2, -132245, -362055, -590743, -519496, 55174.62, 73735.64,
    350149.5, 84096.22, -92851.9, -117008, 135938.9, -536875, -258283, 122033.2, 175507.3, 185176.3,
    -208332, 44418.96, -5628.91, -87397.7, -340040, -523971, 10934.07, 42603.1, -376962, -108280,
    -295423, 120614.1, -164835, 69666.83, 759628.3, 97159.17, 239894.6, 104087.9, 369682.5, 335806.2,
    141318.9, 90828.48, -282975, -304469, 266612.1, 351263.2, 241822.9, 259200.2, -148467, 467373.2,
    15583.45, 123845.1, -360785, 134341.3, -525141, -183199, 635442.8, 186983.6, 124296.2, 54548.41, -41587.7
  ];
  
  // Calculate sum with standard reduce
  const sum = testValues.reduce((acc, val) => acc + val, 0);
  console.log("Sum of test array:", sum);
  
  return sum;
}

// Call the standalone test function
console.log("Running standalone test:");
testArraySum();

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

/**
 * Fetch all user_master details based on the user id stored in the session.
 * @param {number} userId - The id of the logged in user.
 * @returns {Promise<Object>} - The user_master record including related client_master data.
 */
async function fetchUserMasterDetails(userId) {
  const userDetails = await prisma.user_master.findUnique({
    where: { id: userId },
    include: {
      client_master: true, // Include any related client_master records
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
    console.log("session", session.user);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    let user_id = Number(session?.user?.user_id);
    console.log("master__id", user_id);
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

    // Fetch cash flows, master sheet data (for other metrics) and portfolio master data (for currentPortfolioValue, totalProfit, and returns)
    const [cashInOutData, masterSheetData, portfolioMasterData] = await Promise.all([
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

    // --- Build a global mapping of scheme invested amounts for all accounts ---
    const globalSchemeInvestedAmounts = {};
    for (const accountCode of accountCodes) {
      const schemes = Object.keys(PORTFOLIO_MAPPING[accountCode] || {}).filter(
        (scheme) => scheme !== "_total"
      );
      for (const scheme of schemes) {
        const cashForScheme = cashInOutData.filter(
          (entry) =>
            entry.account_code === accountCode && entry.scheme === scheme
        );
        const investedAmount = cashForScheme.reduce((sum, entry) => {
          const capitalAmount = entry.capital_in_out || 0;
          return sum + capitalAmount;
        }, 0);
        if (!globalSchemeInvestedAmounts[scheme]) {
          globalSchemeInvestedAmounts[scheme] = 0;
        }
        globalSchemeInvestedAmounts[scheme] += investedAmount;
      }
    }

    // --- Process accounts and schemes (for metrics etc.) ---
    for (const accountCode of accountCodes) {
      results[accountCode] = {
        clientName: CLIENT_NAMES[accountCode] || "Unknown Client",
        schemes: {},
        totalPortfolio: {},
      };

      const schemes = Object.keys(PORTFOLIO_MAPPING[accountCode] || {}).filter(
        (scheme) => scheme !== "_total"
      );
      const schemeInvestedAmounts = {}; // local for this account

      // Process individual schemes
      for (const scheme of schemes) {
        const portfolioNames = getPortfolioNames(accountCode, scheme);

        // Filter master sheet data for current and metrics names
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
          (entry) =>
            entry.account_code === accountCode && entry.scheme === scheme
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

        // Calculate totalProfit based on existing logic as fallback.
        const calcTotalProfit =
          accountCode === "AC5" && scheme === "Scheme B"
            ? calculateTotalProfit(metricsData, cashForScheme)
            : calculateTotalProfit(currentData, cashForScheme);

        // --- Override currentPortfolioValue, totalProfit and returns using portfolio master data ---
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

        // Calculate trailing returns (with different period options)
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
          currentPortfolioValue: schemeCurrentPortfolioValue,
          investedAmount,
          returns: schemeReturns * 100,
          trailingReturns,
          monthlyPnL: calculateMonthlyPnL(navCurve),
          quarterlyPnL: calculateQuarterlyPnLWithDailyPL(navCurve, cashForScheme, currentData),
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
      // --- Override with portfolio master data for "Scheme Total" ---
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

    // --- Process holdings --- (unchanged grouping and percentage logic)
    const sessionManagedAccountCodes =
      session?.user?.managed_account_codes || accountCodes;
    const holdingsData1 = await prisma.managed_accounts_holdings.findMany({
      where: { account_code: { in: sessionManagedAccountCodes } },
    });
    const groupedByScheme = holdingsData1.reduce((acc, holding) => {
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
        console.log(`Scheme: ${scheme}, Type: ${type}, Denominator: ${denominator}`);
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

