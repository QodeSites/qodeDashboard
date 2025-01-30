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

    // For cumulative view
    if (view_type === "cumulative") {
      // Fetch portfolio details for all nuvama codes
      const allPortfolioDetails = await prisma.portfolio_details.findMany({
        where: {
          nuvama_code: {
            in: userNuvamaCodes,
          },
        },
      });

      console.log('All Portfolio Details:', allPortfolioDetails); // Debug log

      // Calculate cumulative portfolio details and ratios
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

      console.log('Portfolio Ratios:', portfolioRatios); // Debug log

      // Calculate the ratio for each portfolio
      const portfoliosWithRatios = portfolioRatios.map(portfolio => ({
        ...portfolio,
        ratio: totalPortfolioValue > 0 ? (portfolio.portfolio_value / totalPortfolioValue) : 0,
      }));

      console.log('Portfolios With Ratios:', portfoliosWithRatios); // Debug log

      // Calculate cumulative portfolio details
      const cumulativeDetails = allPortfolioDetails.reduce((acc, portfolio) => {
        const initialInvestment = parseFloat(portfolio.initial_investment) || 0;
        const portfolioValue = parseFloat(portfolio.portfolio_value) || 0;
        const cash = parseFloat(portfolio.cash) || 0;
        const name = userEmail === "hiren@prithvigroup.biz"
          ? "HIREN ZAVERCHAND GALA"
          : portfolio.name;


        console.log('Processing portfolio:', {
          nuvama_code: portfolio.nuvama_code,
          initialInvestment,
          portfolioValue,
          cash,
          name: name, // Add name to cumulative details
        });

        return {
          initial_investment: acc.initial_investment + initialInvestment,
          portfolio_value: acc.portfolio_value + portfolioValue,
          cash: acc.cash + cash,
          name: name, // Add name to cumulative details
        };
      }, {
        initial_investment: 0,
        portfolio_value: 0,
        cash: 0,
        name: userEmail === "hiren@prithvigroup.biz" ? "HIREN ZAVERCHAND GALA" : allPortfolioDetails[0]?.name || "",

      });

      // Fetch daily NAV for all nuvama codes
      const allDailyNAV = await prisma.daily_nav.findMany({
        where: {
          nuvama_code: {
            in: userNuvamaCodes,
          },
        },
        orderBy: { date: "asc" },
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

      console.log('Sample of Cumulative Daily NAV:', cumulativeDailyNAV.slice(0, 2)); // Debug log

      return NextResponse.json({
        view_type: "cumulative",
        nuvama_codes: userNuvamaCodes,
        dailyNAV: cumulativeDailyNAV,
        portfolioDetails: cumulativeDetails,
        portfoliosWithRatios,
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

      let [dailyNAV, portfolioDetails] = await Promise.all([
        prisma.daily_nav.findMany({
          where: { nuvama_code },
          orderBy: { date: "asc" },
        }),
        prisma.portfolio_details.findFirst({
          where: { nuvama_code },
        }),
      ]);

      if (!dailyNAV.length && !portfolioDetails ) {
        return NextResponse.json(
          { error: "No data found for the provided nuvama_code" },
          { status: 404 }
        );
      }

      // Override the name if the user is Hiren
      if (userEmail === "hiren@prithvigroup.biz" && portfolioDetails) {
        portfolioDetails = { ...portfolioDetails, name: "HIREN ZAVERCHAND GALA" };
      }

      return NextResponse.json({
        view_type: "individual",
        nuvama_code,
        dailyNAV: dailyNAV || [],
        portfolioDetails: portfolioDetails || null,
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
