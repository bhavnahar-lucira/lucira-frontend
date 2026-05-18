"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react";
import { useState } from "react";

export function DataTable({ columns, data }) {
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-2 max-w-sm px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm group focus-within:ring-1 focus-within:ring-zinc-400 transition-all">
        <Search size={18} className="text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white" />
        <input
          placeholder="Search..."
          value={globalFilter ?? ""}
          onChange={e => setGlobalFilter(e.target.value)}
          className="bg-transparent border-none outline-none text-sm w-full"
        />
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 uppercase text-xs font-semibold">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center text-zinc-500">
                  No results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
        <div className="flex items-center gap-6">
          <div className="text-sm text-zinc-500 whitespace-nowrap">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500 whitespace-nowrap">Go to page:</span>
            <input
              type="number"
              defaultValue={table.getState().pagination.pageIndex + 1}
              onChange={e => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0
                table.setPageIndex(page)
              }}
              className="border border-zinc-200 dark:border-zinc-800 bg-transparent rounded px-2 py-1 text-sm w-16 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <select
            value={table.getState().pagination.pageSize}
            onChange={e => {
              table.setPageSize(Number(e.target.value))
            }}
            className="border border-zinc-200 dark:border-zinc-800 bg-transparent rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
          >
            {[10, 20, 30, 40, 50].map(pageSize => (
              <option key={pageSize} value={pageSize} className="bg-white dark:bg-zinc-900">
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            title="First Page"
          >
            <ChevronsLeft size={18} />
          </button>
          <button
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            title="Previous Page"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            title="Next Page"
          >
            <ChevronRight size={18} />
          </button>
          <button
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            title="Last Page"
          >
            <ChevronsRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
