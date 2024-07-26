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
      <div className="flex flex-col justify-between my-5">
        <h1 className="text-xl text-start font-semibold mb-4">
          Top 10 Drawdowns
        </h1>

        <div className="w-full helvetica-font">
          {/* Header */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-8 mb-8 border-b-2 border-black pb-4">
            {table.getHeaderGroups()[0].headers.map((header) => (
              <div
                key={header.id}
                className="font-bold text-lg uppercase cursor-pointer transition-colors duration-300 hover:text-gray-600"
                onClick={header.column.getToggleSortingHandler()}
              >
                <div className="flex items-center justify-between">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  {header.column.getIsSorted() && (
                    <span className="ml-2 font-normal">
                      {header.column.getIsSorted() === "desc" ? "▼" : "▲"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Body */}
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row, rowIndex) => (
              <div
                key={row.id}
                className={`grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-8 py-6 ${
                  rowIndex % 2 === 0 ? "bg-gray-50" : "bg-white"
                }`}
              >
                {row.getVisibleCells().map((cell) => (
                  <div key={cell.id} className="text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">No results.</div>
          )}
        </div>
      </div>
    </div>
  );
}
