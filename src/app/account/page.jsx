import DefaultLayout from "@/components/Layouts/Layouts";
import React from "react";

export default function Account() {
  return (
    <DefaultLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-full">
        <div className="py-4">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:leading-9 sm:truncate">
            Account
          </h1>
          <div className="sm:hidden my-4">
            {/* <select
              aria-label="Selected tab"
              data-cmid="account:submenu_select|_account_profile"
              className="mt-1 form-select block w-full pl-3 pr-10 py-2 border-gray-300 text-base leading-6 sm:text-sm sm:leading-5 focus:outline-none focus:ring-green-300 focus:border-green-300 transition ease-in-out duration-150"
            > */}
              {/* <option value="/account/profile">Profile</option>
              <option value="/account/subscription">Subscription</option>
              <option value="/account/notifications">Notifications</option> */}
            {/* </select> */}
          </div>
          <div className="hidden sm:block mt-2 mb-4">
            {/* <div>
              <nav className="-mb-px flex">
                <a
                  data-cmid="account_profile_submenu:link|profile"
                  className="whitespace-nowrap py-4 border-b-2 font-medium text-sm leading-5 focus:outline-none focus:ring-1 focus:ring-offset-4 focus:ring-offset-gray-50 focus:ring-green-300 border-green-500 text-green-600"
                  href="/account/profile"
                >
                  Profile
                </a>
                <a
                  data-cmid="account_subscription_submenu:link|subscription"
                  className="whitespace-nowrap py-4 border-b-2 font-medium text-sm leading-5 focus:outline-none focus:ring-1 focus:ring-offset-4 focus:ring-offset-gray-50 focus:ring-green-300 ml-8 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  href="/account/subscription"
                >
                  Subscription
                </a>
                <a
                  data-cmid="account_notifications_submenu:link|notifications"
                  className="whitespace-nowrap py-4 border-b-2 font-medium text-sm leading-5 focus:outline-none focus:ring-1 focus:ring-offset-4 focus:ring-offset-gray-50 focus:ring-green-300 ml-8 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  href="/account/notifications"
                >
                  Notifications
                </a>
              </nav>
            </div> */}
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <section className="mb-8">
                <h6 className="text-lg leading-6 font-medium text-gray-900">
                  Rishabh Nahar
                </h6>
                <p>rishabhnahar@gmail.com</p>
                {/* <button
                  type="button"
                  aria-disabled="false"
                  className="inline-flex items-center justify-center leading-5 focus:outline-none transition ease-in-out duration-150 px-4 py-2 text-xs text-green-600 hover:text-green-500 mt-4"
                  data-cmid="account_profile:button|reset_password"
                >
                  <svg
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1"
                    height="1em"
                    width="1em"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                  </svg>
                  Reset Password
                </button> */}
              </section>
              <section>
                <div className="pb-5 border-b border-gray-200 space-y-2">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Billing Information
                  </h3>
                  <p className="max-w-4xl text-sm leading-5 text-gray-500">
                    You can make changes to your billing information at the time
                    of your next payment.
                  </p>
                </div>
                <div className="mt-4">
                  <div className="sm:grid sm:grid-cols-4 sm:gap-4 py-2 sm:py-1">
                    <dt className="text-sm leading-5 font-medium text-gray-500">
                      Full name
                    </dt>
                    <dd
                      className="mt-1 sm:mt-0 text-sm leading-5 text-gray-900 sm:col-span-2"
                      data-cmid="account_profile:info|full_name"
                    >
                      Rishabh Nahar
                    </dd>
                  </div>
                  <div className="sm:grid sm:grid-cols-4 sm:gap-4 py-2 sm:py-1">
                    <dt className="text-sm leading-5 font-medium text-gray-500">
                      Mobile
                    </dt>
                    <dd
                      className="mt-1 sm:mt-0 text-sm leading-5 text-gray-900 sm:col-span-2"
                      data-cmid="account_profile:info|mobile"
                    >
                      9920111053
                    </dd>
                  </div>
                  <div className="sm:grid sm:grid-cols-4 sm:gap-4 py-2 sm:py-1">
                    <dt className="text-sm leading-5 font-medium text-gray-500">
                      Account type
                    </dt>
                    <dd
                      className="mt-1 sm:mt-0 text-sm leading-5 text-gray-900 sm:col-span-2"
                      data-cmid="account_profile:info|account_type"
                    >
                      Individual
                    </dd>
                  </div>
                  <div className="sm:grid sm:grid-cols-4 sm:gap-4 py-2 sm:py-1">
                    <dt className="text-sm leading-5 font-medium text-gray-500">
                      State
                    </dt>
                    <dd
                      className="mt-1 sm:mt-0 text-sm leading-5 text-gray-900 sm:col-span-2"
                      data-cmid="account_profile:info|state"
                    >
                      Maharashtra
                    </dd>
                  </div>
                  <div className="sm:grid sm:grid-cols-4 sm:gap-4 py-2 sm:py-1">
                    <dt className="text-sm leading-5 font-medium text-gray-500">
                      Pin Code
                    </dt>
                    <dd
                      className="mt-1 sm:mt-0 text-sm leading-5 text-gray-900 sm:col-span-2"
                      data-cmid="account_profile:info|pin_code"
                    >
                      400030
                    </dd>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};
