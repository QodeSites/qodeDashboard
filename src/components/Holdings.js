import React, { useMemo } from "react";
import { useTable, useSortBy } from "react-table";
import { useFetchHoldings } from "@/app/lib/api";

const Holdings = ({ strategy }) => {
  const { holding, isLoading, error } = useFetchHoldings(`/holdings.json`);

  function numberWithCommas(x) {
    const num = parseFloat(x).toFixed(2);
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  const columns = useMemo(
    () => [
      {
        Header: "Stock Name",
        accessor: "StockName",
      },
      {
        Header: "Quantity",
        accessor: "Quantity",
        Cell: ({ value }) => <div className="text-right">{value}</div>,
      },
      {
        Header: "Invested Amount",
        accessor: "Invested Amount",
        Cell: ({ value }) => (
          <div className="text-right">{numberWithCommas(value)}</div>
        ),
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
            className={`text-right ${
              parseFloat(value) >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {numberWithCommas(value)}%
          </div>
        ),
      },
    ],
    []
  );

  const data = useMemo(() => {
    if (!holding || !holding[strategy]) return [];
    return holding[strategy];
  }, [holding, strategy]);

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
    <>
      <div className="text-2xl mt-5">Current Holdings</div>
      <p className="mb-5 text-sm text-gray-700">Our 30 holdings.</p>
      <div className="overflow-x-auto">
        <table
          {...getTableProps()}
          className="min-w-full bg-white border border-gray-300"
        >
          <thead>
            {headerGroups.map((headerGroup, i) => (
              <tr
                {...headerGroup.getHeaderGroupProps()}
                key={i}
                className="bg-gray-100"
              >
                {headerGroup.headers.map((column, index) => (
                  <th
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    key={column.id || index}
                    className={`px-6 py-3 text-xs font-medium text-gray-900 uppercase tracking-wider cursor-pointer ${
                      index === 0 ? "text-left" : "text-right"
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
                      className={`px-6 py-4 whitespace-nowrap border-b text-sm text-gray-900 ${
                        index === 0 ? "" : "text-right"
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
    </>
  );
};

export default Holdings;
