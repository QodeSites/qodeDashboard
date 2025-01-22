import React from "react";
import {
  User,
  Building,
  CreditCard,
  Shield,
  Wallet
} from "lucide-react";
import Text from "./common/Text";
import Heading from "./common/Heading";

const ProfilePage = ({ data }) => {
  if (!data) return null;

  const formatNumber = (num) => {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(num);
  };

  const personalInfo = [
    {
      icon: <User className="w-1 h-1 sm:w-1 sm:h-1 text-brown dark:text-beige" />,
      label: "Full Name",
      value: data.name,
    },
    {
      icon: <CreditCard className="w-1 h-1 sm:w-1 sm:h-1 text-brown dark:text-beige" />,
      label: "Nuvama Code",
      value: data.nuvama_code,
    },
    {
      icon: <Building className="w-1 h-1 sm:w-1 sm:h-1 text-brown dark:text-beige" />,
      label: "Account Type",
      value: data.account,
    },
  ];

  const accountDetails = [
    {
      icon: <Wallet className="w-1 h-1 sm:w-1 sm:h-1 text-brown dark:text-beige" />,
      label: "Initial Investment",
      value: `₹${formatNumber(data.initial_investment)}`,
    },
    {
      icon: <Shield className="w-1 h-1 sm:w-1 sm:h-1 text-brown dark:text-beige" />,
      label: "Strategy",
      value: data.strategy,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto p-1 bg-white dark:bg-black">
      {/* Header Section */}
      <div className="mb-6">
        <Heading className="italic text-brown dark:text-beige font-bold text-xl sm:text-2xl">
          Account Profile
        </Heading>
        <Text className="text-sm text-gray-600 dark:text-gray-400">
          Manage your account information and settings
        </Text>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Personal Information Section */}
        <div className="p-2 border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded">
          <Text className="text-lg sm:text-xl text-brown dark:text-beige font-semibold mb-4">
            Personal Information
          </Text>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
            {personalInfo.map((item, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 p-1 border border-gray-100 dark:border-gray-800 
                          bg-white dark:bg-black rounded transition-colors duration-200 
                          hover:shadow-md dark:hover:shadow-gray-800"
              >
                {item.icon}
                <div>
                  <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {item.label}
                  </Text>
                  <Text className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {item.value}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Account Details Section */}
        <div className="p-2 border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded">
          <Text className="text-lg sm:text-xl text-brown dark:text-beige font-semibold mb-4">
            Account Details
          </Text>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {accountDetails.map((item, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 p-1 border border-gray-100 dark:border-gray-800
                          bg-white dark:bg-black rounded transition-colors duration-200
                          hover:shadow-md dark:hover:shadow-gray-800"
              >
                {item.icon}
                <div>
                  <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {item.label}
                  </Text>
                  <Text className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {item.value}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Disclaimer */}
        <div className="mt-6">
          <Text className="text-xs text-gray-500 dark:text-gray-400 italic">
            * Investment values and returns are subject to market risks. Past performance is not indicative of future returns.
          </Text>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
