"use client";

import { ReactNode } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export interface GlassTableColumn {
  key: string;
  header: string;
  className?: string;
  width?: string;
}

export interface GlassTableRow {
  id: string | number;
  cells: ReactNode[];
  className?: string;
}

interface GlassTableProps {
  columns: GlassTableColumn[];
  rows: GlassTableRow[];
  loading?: boolean;
  emptyMessage?: string;
  emptyState?: ReactNode;
  skeletonCount?: number;
  className?: string;
}

export default function GlassTable({
  columns,
  rows,
  loading = false,
  emptyMessage = "No records found",
  emptyState,
  skeletonCount = 5,
  className = "",
}: GlassTableProps) {
  if (loading) {
    return (
      <div className={`overflow-x-auto ${className}`}>
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200/80 hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={`text-gray-700 font-semibold text-sm tracking-tight py-3 px-4 ${column.className || ''}`}
                  style={{ width: column.width }}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(skeletonCount)].map((_, i) => (
              <TableRow key={i}>
                {columns.map((column) => (
                  <TableCell key={`${column.key}-${i}`} className="py-3 px-4">
                    <Skeleton className="h-11 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={`overflow-x-auto ${className}`}>
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200/80 hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={`text-gray-700 font-semibold text-sm tracking-tight py-3 px-4 ${column.className || ''}`}
                  style={{ width: column.width }}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-gray-500 py-12 text-sm">
                {emptyState || emptyMessage}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-200/80 hover:bg-transparent">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={`text-gray-700 font-semibold text-sm tracking-tight py-3 px-4 ${column.className || ''}`}
                style={{ width: column.width }}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              className={`border-b border-gray-200/60 hover:bg-gray-50/50 transition-colors ${row.className || ''}`}
            >
              {row.cells.map((cell, index) => (
                <TableCell key={`${row.id}-${index}`} className="py-3 px-4">
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
