import { createColumnHelper } from "@tanstack/react-table";

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.accessor("date", {
    header: "Date",
    cell: ({ getValue }) => {
      const date = new Date(getValue());
      return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString();
    },
  }),
  columnHelper.accessor("value", {
    header: "Drawdown (%)",
    cell: ({ getValue }) => {
      const value = parseFloat(getValue());
      return isNaN(value) ? "N/A" : `${value.toFixed(2)}%`;
    },
  }),
];
