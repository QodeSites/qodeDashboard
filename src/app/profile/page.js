"use client";

import DefaultLayout from "@/components/Layouts/Layouts";

const { default: ProfilePage } = require("@/components/Profile");
const { default: useFetchStrategyData } = require("@/hooks/useFetchStrategyData");

// In your page component
const ClientProfilePage = () => {
    const { data, isLoading, error } = useFetchStrategyData();

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <DefaultLayout>

            <div className="min-h-screen bg-black">
                <ProfilePage data={data?.portfolioDetails} />
            </div>
        </DefaultLayout>
    );
};

export default ClientProfilePage;