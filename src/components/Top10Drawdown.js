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

    <div className="flex bg-[#fafafa]  p-16 flex-col justify-between my-20">
      <h1 className="text-3xl text-start font-black sophia-pro-font mb-10">
        Top 10 Drawdowns
      </h1>

      <div className="w-full bg-white ">
        {/* Header */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] border-b ">
          {table.getHeaderGroups()[0].headers.map((header) => (
            <div
              key={header.id}
              className="text-md uppercase sophia-pro-font font-bold cursor-pointer transition-colors duration-300 hover:text-gray-600 p-4 last:border-r-0"
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
              className={`grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))]  last:border-b-0 `}
            >
              {row.getVisibleCells().map((cell, cellIndex) => (
                <div
                  key={cell.id}
                  className="text-lg p-4"
                >
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
  );
}
