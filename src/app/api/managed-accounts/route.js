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

        // First, get the system tags from schemes
        const schemes = await prisma.scheme.findMany({
            where: { 
                client_id: parseInt(userId) 
            },
            select: { 
                system_tag: true,
                scheme_name: true 
            }
        });

        console.log("Schemes:", schemes);
        

        // Group schemes by scheme_name and then by system_tag (strategy)
        const groupedSchemes = schemes.reduce((acc, scheme) => {
            if (!acc[scheme.scheme_name]) {
                acc[scheme.scheme_name] = {};
            }
            if (scheme.system_tag) {
                if (!acc[scheme.scheme_name][scheme.system_tag]) {
                    acc[scheme.scheme_name][scheme.system_tag] = [];
                }
                acc[scheme.scheme_name][scheme.system_tag].push(scheme.system_tag);
            }
            return acc;
        }, {});


        console.log("Grouped schemes:", groupedSchemes);

        // Fetch master sheet data for each group of system tags, ordered by date
        const groupedMasterSheetData = {};

        for (const [schemeName, strategies] of Object.entries(groupedSchemes)) {
            groupedMasterSheetData[schemeName] = {};

            for (const [strategy, systemTags] of Object.entries(strategies)) {
                console.log("Fetching data for:", schemeName, strategy, systemTags);
                const masterSheetData = await prisma.master_sheet.findMany({
                    where: { 
                        system_tag: { in: systemTags }
                    },
                    orderBy: {
                        date: 'asc' // Change to 'desc' for descending order
                    }
                });

                groupedMasterSheetData[schemeName][strategy] = masterSheetData;
            }
        }

        return NextResponse.json({ 
            data: groupedMasterSheetData
        }, { status: 200 });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
