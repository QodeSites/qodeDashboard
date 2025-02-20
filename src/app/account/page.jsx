"use client";

import Heading from "@/components/common/Heading";
import DefaultLayout from "@/components/Layouts/Layouts";
import { is } from "date-fns/locale";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";

export default function Account() {
  const { data: session, status } = useSession();

  const [accountData, setAccountData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reset password form state
  const [resetForm, setResetForm] = useState({
    email: session?.user?.email || "",
    token: "",
    password: "",
    confirmPassword: "",
  });
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState(null);
  const [resetMessage, setResetMessage] = useState(null);

  // Update email in reset form if session changes
  useEffect(() => {
    if (session?.user?.email) {
      setResetForm((prev) => ({ ...prev, email: session.user.email }));
    }
  }, [session]);

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
  }, [apiUrl]);

  const handleResetChange = (e) => {
    const { name, value } = e.target;
    setResetForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (resetForm.password !== resetForm.confirmPassword) {
      setResetError("Passwords do not match");
      return;
    }
    setResetLoading(true);
    setResetError(null);
    setResetMessage(null);

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: resetForm.email,
          token: resetForm.token,
          password: resetForm.password,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setResetError(result.error || "Error resetting password");
      } else {
        setResetMessage(result.message);
        // Optionally clear the token and password fields after a successful reset
        setResetForm((prev) => ({
          ...prev,
          token: "",
          password: "",
          confirmPassword: "",
        }));
      }
    } catch (error) {
      setResetError("An unexpected error occurred");
    } finally {
      setResetLoading(false);
    }
  };

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

          {/* Account Profile Section */}
          <div className="bg-white overflow-hidden shadow rounded-lg my-6">
            <div className="px-4 py-5 sm:p-6">
              <section className="mb-8">
                <h6 className="text-lg leading-6 font-medium text-gray-900">
                  {userMasterDetails?.full_name || "name not available"}
                </h6>
                <p>{userMasterDetails?.email || "email not available"}</p>
              </section>

              {/* Billing / Profile Information Section */}
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

          {/* Optional: Render Account Details if Available */}
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
          {isManagedAccounts && (
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
          )}
          {/* Reset Password Section */}
          {/* <div className="bg-white overflow-hidden shadow rounded-lg my-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Reset Password
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Enter the reset token and your new password below.
              </p>
              <form onSubmit={handleResetSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={resetForm.email}
                    readOnly
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Reset Token
                  </label>
                  <input
                    type="text"
                    name="token"
                    value={resetForm.token}
                    onChange={handleResetChange}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={resetForm.password}
                    onChange={handleResetChange}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={resetForm.confirmPassword}
                    onChange={handleResetChange}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                {resetError && (
                  <p className="text-red-500 text-sm">{resetError}</p>
                )}
                {resetMessage && (
                  <p className="text-green-500 text-sm">{resetMessage}</p>
                )}
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  {resetLoading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            </div>
          </div> */}
          
        </div>
      </div>
    </DefaultLayout>
  );
}
