import React, { useMemo } from "react";
import { useTable, useSortBy } from "react-table";
import { useFetchHoldings } from "@/app/lib/api";

const Holdings = ({ strategy }) => {
  const { holding, isLoading, error } = useFetchHoldings(`/holdings.json`);

  function numberWithCommas(x) {
    const num = parseFloat(x).toFixed(2);
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  const data = useMemo(() => {
    if (!holding || !holding[strategy]) return [];

    // Calculate total invested amount
    const totalInvested = holding[strategy].reduce((sum, stock) => sum + parseFloat(stock["Invested Amount"]), 0);

    // Calculate percentage for each holding
    return holding[strategy].map(stock => ({
      ...stock,
      InvestmentPercentage: (parseFloat(stock["Invested Amount"]) / totalInvested * 100).toFixed(2)
    }));
  }, [holding, strategy]);

  const columns = useMemo(
    () => [
      {
        Header: "Stock Name",
        accessor: "StockName",
      },
      {
        Header: "Weight",
        accessor: "InvestmentPercentage",
        Cell: ({ value }) => <div className="text-right">{value}%</div>,
      },
      {
        Header: "Current Price",
        accessor: "Current Price",
        Cell: ({ value }) => (
          <div className="text-right">{numberWithCommas(value)}</div>
        ),
      },
      {
        Header: "P&L",
        accessor: "Unrealized P&L %",
        Cell: ({ value }) => (
          <div
            className={`text-right ${parseFloat(value) >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {numberWithCommas(value)}%
          </div>
        ),
      },
    ],
    []
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({ columns, data }, useSortBy);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-white">
        <div className="w-16 h-16 border-t-4 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 p-4">Error: {error}</div>;
  }

  if (!holding || !holding[strategy]) {
    return <div className="p-4"></div>;
  }

  return (
    <div className=" bg-[#fafafa] p-16 mt-16 minion-pro-font">
      <div className="text-3xl sophia-pro-font font-black mt-5">Current Holdings</div>
      <p className="mb-5 mt-4  sophia-pro-font text-md text-black">Our 30 holdings.</p>
      <div className="overflow-x-auto mt-10">
        <table
          {...getTableProps()}
          className="min-w-full bg-white  "
        >
          <thead>
            {headerGroups.map((headerGroup, i) => (
              <tr
                {...headerGroup.getHeaderGroupProps()}
                key={i}
                className="border-b "
              >
                {headerGroup.headers.map((column, index) => (
                  <th
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    key={column.id || index}
                    className={`px-6 py-4 sophia-pro-font font-bold text-md text-gray-900 uppercase tracking-wider cursor-pointer ${index === 0 ? "text-left" : "text-right"
                      }`}
                  >
                    {column.render("Header")}
                    <span className="ml-2">
                      {column.isSorted
                        ? column.isSortedDesc
                          ? " 🔽"
                          : " 🔼"
                        : ""}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map((row, i) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()} key={i} className="hover:bg-gray-50">
                  {row.cells.map((cell, index) => (
                    <td
                      {...cell.getCellProps()}
                      key={cell.column.id}
                      className={`px-6 py-5 whitespace-nowrap  text-md text-gray-900 ${index === 0 ? "" : "text-right"
                        }`}
                    >
                      {cell.render("Cell")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Holdings;
