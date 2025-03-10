"use client";

import Heading from "@/components/common/Heading";
import DefaultLayout from "@/components/Layouts/Layouts";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";

export default function Account() {
  const { data: session } = useSession();

  const [accountData, setAccountData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reset password form state (for token-based reset; kept here for reference)
  const [resetForm, setResetForm] = useState({
    email: session?.user?.email || "",
    token: "",
    password: "",
    confirmPassword: "",
  });
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState(null);
  const [resetMessage, setResetMessage] = useState(null);

  // Change password form state for authenticated users
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changeForm, setChangeForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeError, setChangeError] = useState(null);
  const [changeMessage, setChangeMessage] = useState(null);

  // State to control modal visibility
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Determine if managed accounts exist and choose the API endpoint accordingly
  const isManagedAccounts =
    session?.user?.managed_account_codes &&
    session.user.managed_account_codes.length > 0;
  const apiUrl = isManagedAccounts
    ? "/api/managed-accounts?view_type=account"
    : "/api/portfolio-data?view_type=account";

  // Fetch account data once the session is available
  useEffect(() => {
    if (session) {
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
    }
  }, [apiUrl, session]);

  // Update reset form email when session changes
  useEffect(() => {
    if (session?.user?.email) {
      setResetForm((prev) => ({ ...prev, email: session.user.email }));
    }
  }, [session]);

  const handleChangePasswordChange = (e) => {
    const { name, value } = e.target;
    setChangeForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setChangeError(null);
    setChangeMessage(null);
    if (changeForm.newPassword !== changeForm.confirmNewPassword) {
      setChangeError("New password and confirm password do not match.");
      return;
    }
    setChangeLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          currentPassword: changeForm.currentPassword,
          newPassword: changeForm.newPassword,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setChangeError(result.error || "Error changing password.");
      } else {
        setChangeMessage(result.message || "Password changed successfully.");
        setChangeForm({
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
        setShowChangePassword(false);

        // Trigger modal popup and send email confirmation
        setShowSuccessModal(true);
        await fetch("/api/notify-password-change", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: session.user.email }),
        });
      }
    } catch (error) {
      setChangeError("An unexpected error occurred.");
    } finally {
      setChangeLoading(false);
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
          {!isManagedAccounts && (
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

          {/* Change Password Section */}
          <div className="bg-white overflow-hidden shadow rounded-lg my-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Change Password
              </h3>
              <button
                onClick={() => setShowChangePassword(!showChangePassword)}
                className="mt-2 text-blue-500 hover:underline"
              >
                {showChangePassword ? "Cancel" : "Change Password"}
              </button>
              {showChangePassword && (
                <form
                  onSubmit={handleChangePasswordSubmit}
                  className="mt-4 space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={changeForm.currentPassword}
                      onChange={handleChangePasswordChange}
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
                      name="newPassword"
                      value={changeForm.newPassword}
                      onChange={handleChangePasswordChange}
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
                      name="confirmNewPassword"
                      value={changeForm.confirmNewPassword}
                      onChange={handleChangePasswordChange}
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    />
                  </div>
                  {changeError && (
                    <p className="text-red-500 text-sm">{changeError}</p>
                  )}
                  {changeMessage && (
                    <p className="text-green-500 text-sm">{changeMessage}</p>
                  )}
                  <button
                    type="submit"
                    disabled={changeLoading}
                    className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {changeLoading ? "Updating..." : "Update Password"}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Modal Popup for Success */}
          {showSuccessModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white rounded p-6 max-w-sm mx-auto">
                <h3 className="text-xl font-bold mb-4">Success!</h3>
                <p className="mb-4">
                  Your password has been reset successfully. A confirmation email has been sent.
                </p>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DefaultLayout>
  );
}
