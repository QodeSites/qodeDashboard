import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const nuvama_code = searchParams.get("nuvama_code");
    const view_type = searchParams.get("view_type") || "individual";

    // Get all nuvama_codes for the user from session
    const userNuvamaCodes = Array.isArray(session.user.nuvama_codes)
      ? session.user.nuvama_codes
      : [session.user.nuvama_codes];

    console.log('User Nuvama Codes:', userNuvamaCodes);

    // For cumulative view
    if (view_type === "cumulative") {
      // Fetch portfolio details for all nuvama codes
      const [allPortfolioDetails, allDailyNAV, allTrailingReturns] = await Promise.all([
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
        prisma.trailing_returns.findMany({
          where: {
            nuvama_code: {
              in: userNuvamaCodes,
            },
          },
        }),
      ]);

      console.log('Raw Portfolio Details:', allPortfolioDetails);

      // Calculate cumulative portfolio details
      const cumulativeDetails = allPortfolioDetails.reduce((acc, portfolio) => {
        const initialInvestment = parseFloat(portfolio.initial_investment) || 0;
        const portfolioValue = parseFloat(portfolio.portfolio_value) || 0;
        const cash = parseFloat(portfolio.cash) || 0;

        console.log('Processing portfolio:', {
          nuvama_code: portfolio.nuvama_code,
          initialInvestment,
          portfolioValue,
          cash
        });

        return {
          initial_investment: acc.initial_investment + initialInvestment,
          portfolio_value: acc.portfolio_value + portfolioValue,
          cash: acc.cash + cash,
        };
      }, {
        initial_investment: 0,
        portfolio_value: 0,
        cash: 0,
      });

      console.log('Cumulative Details:', cumulativeDetails);

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
          nav_value: daily.nav_value / daily.count,
          benchmark_value: daily.benchmark_value / daily.count,
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      console.log('Sample of Cumulative Daily NAV:', cumulativeDailyNAV.slice(0, 2));

      // Calculate average trailing returns
      const trailingReturnsSum = allTrailingReturns.reduce((acc, returns) => ({
        mtd: acc.mtd + (parseFloat(returns.mtd) || 0),
        qtd: acc.qtd + (parseFloat(returns.qtd) || 0),
        ytd: acc.ytd + (parseFloat(returns.ytd) || 0),
        one_year: acc.one_year + (parseFloat(returns.one_year) || 0),
        three_year: acc.three_year + (parseFloat(returns.three_year) || 0),
        five_year: acc.five_year + (parseFloat(returns.five_year) || 0),
        count: acc.count + 1,
      }), {
        mtd: 0,
        qtd: 0,
        ytd: 0,
        one_year: 0,
        three_year: 0,
        five_year: 0,
        count: 0,
      });

      const averageTrailingReturns = trailingReturnsSum.count > 0 ? {
        mtd: trailingReturnsSum.mtd / trailingReturnsSum.count,
        qtd: trailingReturnsSum.qtd / trailingReturnsSum.count,
        ytd: trailingReturnsSum.ytd / trailingReturnsSum.count,
        one_year: trailingReturnsSum.one_year / trailingReturnsSum.count,
        three_year: trailingReturnsSum.three_year / trailingReturnsSum.count,
        five_year: trailingReturnsSum.five_year / trailingReturnsSum.count,
      } : null;

      console.log('Average Trailing Returns:', averageTrailingReturns);

      return NextResponse.json({
        view_type: "cumulative",
        nuvama_codes: userNuvamaCodes,
        dailyNAV: cumulativeDailyNAV,
        portfolioDetails: cumulativeDetails,
        trailingReturns: averageTrailingReturns,
      });
    }

    // For individual view (existing code)
    if (view_type === "individual" && nuvama_code) {
      // Validate nuvama_code belongs to user
      if (!userNuvamaCodes.includes(nuvama_code)) {
        return NextResponse.json(
          { error: "Unauthorized access to this nuvama code" },
          { status: 403 }
        );
      }

      const [dailyNAV, portfolioDetails, trailingReturns] = await Promise.all([
        prisma.daily_nav.findMany({
          where: { nuvama_code },
          orderBy: { date: "asc" },
        }),
        prisma.portfolio_details.findFirst({
          where: { nuvama_code },
        }),
        prisma.trailing_returns.findFirst({
          where: { nuvama_code },
        }),
      ]);

      if (!dailyNAV.length && !portfolioDetails && !trailingReturns) {
        return NextResponse.json(
          { error: "No data found for the provided nuvama_code" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        view_type: "individual",
        nuvama_code,
        dailyNAV: dailyNAV || [],
        portfolioDetails: portfolioDetails || null,
        trailingReturns: trailingReturns || null,
      });
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