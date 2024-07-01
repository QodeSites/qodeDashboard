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

  return (
    <div className="p-4 border rounded-lg">
      <h1 className="text-2xl mb-5 font-black">Top 10 Drawdowns</h1>
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-md">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-black uppercase bg-gray-400">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 cursor-pointer hover:bg-gray-100"
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
                <tr
                  key={row.id}
                  className={`${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } border-b hover:bg-gray-100`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
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
      <div className="flex items-center justify-end space-x-2 py-4">
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
      </div>
    </div>
  );
}
