"use client";

import Heading from "@/components/common/Heading";
import DefaultLayout from "@/components/Layouts/Layouts";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";

export default function Account() {
  const { data: session, status } = useSession();

  const [accountData, setAccountData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if managed_account_codes exists and has at least one entry
  const isManagedAccounts =
    session?.user?.managed_account_codes &&
    session.user.managed_account_codes.length > 0;

  let apiUrl = isManagedAccounts
    ? "/api/managed-accounts?view_type=account"
    : "/api/portfolio-data?view_type=account";

  useEffect(() => {
    // Fetch account details from your API
    const fetchAccountData = async () => {
      try {
        const res = await fetch(apiUrl);
        if (!res.ok) {
          throw new Error("Failed to fetch account details");
        }
        const data = await res.json();
        setAccountData(data);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, []);

  if (loading) {
    return (
      <DefaultLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-full">
          <p>Loading account details...</p>
        </div>
      </DefaultLayout>
    );
  }

  if (error) {
    return (
      <DefaultLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-full">
          <p className="text-red-500">{error}</p>
        </div>
      </DefaultLayout>
    );
  }

  // Destructure the userMasterDetails and accountDetails from the API response
  const { userMasterDetails, accountDetails } = accountData || {};

  return (
    <DefaultLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-full">
        <div className="py-4">
          <Heading className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:leading-9 sm:truncate">
            account
          </Heading>

          {/* account profile section */}
          <div className="bg-white overflow-hidden shadow rounded-lg my-6">
            <div className="px-4 py-5 sm:p-6">
              <section className="mb-8">
                <h6 className="text-lg leading-6 font-medium text-gray-900">
                  {userMasterDetails?.full_name || "name not available"}
                </h6>
                <p>{userMasterDetails?.email || "email not available"}</p>
              </section>

              {/* billing / profile information section */}
              <section>
                <div className="pb-5 border-b border-gray-200 space-y-2">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    billing information
                  </h3>
                </div>
                <div className="mt-4">
                  <div className="sm:grid sm:grid-cols-4 sm:gap-4 py-2 sm:py-1">
                    <dt className="text-sm leading-5 font-medium text-gray-500">
                      full name
                    </dt>
                    <dd className="mt-1 sm:mt-0 text-sm leading-5 text-gray-900 sm:col-span-2">
                      {userMasterDetails?.full_name || "-"}
                    </dd>
                  </div>
                  <div className="sm:grid sm:grid-cols-4 sm:gap-4 py-2 sm:py-1">
                    <dt className="text-sm leading-5 font-medium text-gray-500">
                      mobile
                    </dt>
                    <dd className="mt-1 sm:mt-0 text-sm leading-5 text-gray-900 sm:col-span-2">
                      {userMasterDetails?.mobile || "-"}
                    </dd>
                  </div>
                  <div className="sm:grid sm:grid-cols-4 sm:gap-4 py-2 sm:py-1">
                    <dt className="text-sm leading-5 font-medium text-gray-500">
                      account type
                    </dt>
                    <dd className="mt-1 sm:mt-0 text-sm leading-5 text-gray-900 sm:col-span-2">
                      {userMasterDetails?.account_type || "-"}
                    </dd>
                  </div>
                  <div className="sm:grid sm:grid-cols-4 sm:gap-4 py-2 sm:py-1">
                    <dt className="text-sm leading-5 font-medium text-gray-500">
                      State
                    </dt>
                    <dd className="mt-1 sm:mt-0 text-sm leading-5 text-gray-900 sm:col-span-2">
                      {userMasterDetails?.state || "-"}
                    </dd>
                  </div>
                  <div className="sm:grid sm:grid-cols-4 sm:gap-4 py-2 sm:py-1">
                    <dt className="text-sm leading-5 font-medium text-gray-500">
                      Pin Code
                    </dt>
                    <dd className="mt-1 sm:mt-0 text-sm leading-5 text-gray-900 sm:col-span-2">
                      {userMasterDetails?.pin_code || "-"}
                    </dd>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Optional: Render account details if available */}
          {accountDetails && accountDetails.length > 0 && (
            <div className="bg-white overflow-hidden shadow rounded-lg my-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Managed Accounts
                </h3>
                <ul className="mt-4 divide-y divide-gray-200">
                  {accountDetails.map((account) => (
                    <li
                      key={account.id}
                      className="py-4 flex flex-col sm:flex-row justify-between"
                    >
                      <span className="text-sm font-medium text-gray-900">
                        {account.client_name || "Account Name"}
                      </span>
                      {account.account_code && (
                        <span className="text-sm text-gray-500">
                          Code: {account.account_code}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Nuvama Wealth Spectrum Link Section */}
          <div className="bg-white overflow-hidden shadow rounded-lg my-6">
            <div className="px-4 py-5 sm:p-6">
              {/* Nuvama Wealth Logo */}
              <div className="flex justify-left">
                <img
                  src="/nuvama_logo_transparent.png"
                  alt="Nuvama Wealth Logo"
                  className="h-12 w-auto mb-4"
                />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Nuvama Wealth Spectrum
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                For additional details use the link below to login to Nuvama
              </p>
              <a
                href="https://eclientreporting.nuvamaassetservices.com/wealthspectrum/app/login"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-sm text-white bg-[#d1a47b] hover:bg-[#d1a47b]"
              >
                Login to Nuvama
              </a>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
