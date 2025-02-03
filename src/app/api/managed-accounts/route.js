import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("user_id");

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // Step 1: Fetch account_code from managed_account_clients
        const managedAccounts = await prisma.managed_account_clients.findMany({
            where: {
                id: parseInt(userId)
            },
            select: {
                account_code: true
            }
        });

        const accountCodes = managedAccounts.map(account => account.account_code);

        if (accountCodes.length === 0) {
            return NextResponse.json({ error: "No accounts found for the user" }, { status: 404 });
        }

        // Step 2: Fetch capital_in_out and dividend from managed_accounts_cash_in_out
        const cashInOutData = await prisma.managed_accounts_cash_in_out.findMany({
            where: {
                account_code: { in: accountCodes }
            },
            select: {
                date: true,
                scheme: true,
                capital_in_out: true,
                dividend: true
            },
            orderBy: {
                date: 'desc'
            }
        });

        // Step 3: Sum capital_in_out and dividend
        const totalCapitalInvested = cashInOutData.reduce((sum, entry) => sum + (entry.capital_in_out || 0), 0);
        const totalDividends = cashInOutData.reduce((sum, entry) => sum + (entry.dividend || 0), 0);

        // Step 4: Group cashInOutData by scheme and calculate scheme-wise capital invested
        const schemeWiseCapitalInvested = cashInOutData.reduce((acc, entry) => {
            const scheme = entry.scheme;
            if (!acc[scheme]) {
                acc[scheme] = 0;
            }
            acc[scheme] += entry.capital_in_out || 0;
            return acc;
        }, {});

        // Step 5: Get the system tags and account names from schemes (earlier logic)
        const schemes = await prisma.scheme.findMany({
            where: {
                client_id: parseInt(userId)
            },
            select: {
                system_tag: true,
                scheme_name: true,
                account_name: true
            }
        });

        // Step 6: Group schemes by scheme_name and then by account_name (strategy)
        // -------------------------------------------------------------------------
        // The original grouping by system_tag is kept as a comment below:
        // const groupedSchemes = schemes.reduce((acc, scheme) => {
        //     if (!acc[scheme.scheme_name]) {
        //         acc[scheme.scheme_name] = {};
        //     }
        //     if (scheme.system_tag) {
        //         if (!acc[scheme.scheme_name][scheme.system_tag]) {
        //             acc[scheme.scheme_name][scheme.system_tag] = [];
        //         }
        //         acc[scheme.scheme_name][scheme.system_tag].push(scheme.system_tag);
        //     }
        //     return acc;
        // }, {});

        const groupedSchemes = schemes.reduce((acc, scheme) => {
            if (!acc[scheme.scheme_name]) {
                acc[scheme.scheme_name] = {};
            }
            if (scheme.account_name) {
                if (!acc[scheme.scheme_name][scheme.account_name]) {
                    acc[scheme.scheme_name][scheme.account_name] = [];
                }
                acc[scheme.scheme_name][scheme.account_name].push(scheme.account_name);
            }
            return acc;
        }, {});

        // Step 7: Fetch master sheet data for each group of account names, ordered by date
        const groupedMasterSheetData = {};

        for (const [schemeName, strategies] of Object.entries(groupedSchemes)) {
            groupedMasterSheetData[schemeName] = {};

            for (const [strategy, accountNames] of Object.entries(strategies)) {
                // The original code using system_tag is preserved in comments:
                // const masterSheetData = await prisma.master_sheet.findMany({
                //     where: { 
                //         system_tag: { in: systemTags }
                //     },
                //     orderBy: {
                //         date: 'asc' // Change to 'desc' for descending order
                //     }
                // });

                const masterSheetData = await prisma.master_sheet.findMany({
                    where: {
                        account_names: { in: accountNames }
                    },
                    orderBy: {
                        date: 'asc' // Change to 'desc' for descending order
                    }
                });

                groupedMasterSheetData[schemeName][strategy] = masterSheetData;
            }
        }


        // Step 8: Return the results
        return NextResponse.json({
            data: groupedMasterSheetData,
            totalCapitalInvested,
            totalDividends,
            schemeWiseCapitalInvested, // Add scheme-wise capital invested
            cashInOutData
        }, { status: 200 });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}