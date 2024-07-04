import React, { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";

// Define columns here instead of importing
const columns = [
  {
    header: "Peak Date",
    accessorKey: "peakDate",
    cell: ({ getValue }) => new Date(getValue()).toLocaleDateString(),
  },
  {
    header: "Drawdown Date",
    accessorKey: "drawdownDate",
    cell: ({ getValue }) => new Date(getValue()).toLocaleDateString(),
  },
  {
    header: "Worst Drawdown (%)",
    accessorKey: "worstDrawdown",
    cell: ({ getValue }) => `${getValue()}%`,
  },
  {
    header: "Recovery Date",
    accessorKey: "recoveryDate",
    cell: ({ getValue }) =>
      getValue()
        ? new Date(getValue()).toLocaleDateString()
        : "Not Yet Recovered",
  },
  {
    header: "Recovery Period (days)",
    accessorKey: "recoveryPeriod",
    cell: ({ getValue }) => (getValue() ? Math.round(getValue()) : "N/A"),
  },
  {
    header: "Peak to Peak (days)",
    accessorKey: "peakToPeak",
    cell: ({ getValue }) => (getValue() ? Math.round(getValue()) : "N/A"),
  },
];

export default function Top10Drawdown({ drawdowns }) {
  const [sorting, setSorting] = useState([]);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const table = useReactTable({
    data: drawdowns,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
    },
  });

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };
  return (
    <div
      className={`rounded-lg ${
        isFullScreen ? "fixed inset-0 z-50 bg-white" : ""
      }`}
    >
      <div className="flex justify-between items-center my-5">
        <h1 className="text-xl font-semibold mb-4">Top 10 Drawdowns</h1>
        <button
          onClick={toggleFullScreen}
          className="p-2  text-gray-900 hover:text-gray-700 focus:outline-none"
          title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
        >
          {isFullScreen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M22 3h-6m0 0l5 5m-5-5v6m0-6H9m11 11v6m0 0l-5-5m5 5h-6m0 0V9"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          )}
        </button>
      </div>
      <div
        className={`overflow-x-auto  no-scrollbar ${
          isFullScreen ? "h-[calc(100vh-120px)]" : "h-64"
        }`}
      >
        <table className="w-full text-sm text-left text-gray-900">
          <thead className="text-xs text-black uppercase bg-[#efefef]/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 cursor-pointer hover:bg-gray-100"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {header.column.getIsSorted() ? (
                        header.column.getIsSorted() === "desc" ? (
                          <svg
                            className="w-4 h-4 ml-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            ></path>
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4 ml-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                              clipRule="evenodd"
                            ></path>
                          </svg>
                        )
                      ) : (
                        <svg
                          className="w-4 h-4 ml-1 text-gray-300"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, i) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-4 whitespace-nowrap">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-4 text-center text-gray-500"
                >
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* <div className="flex items-center justify-end space-x-2 py-4">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div> */}
    </div>
  );
}
