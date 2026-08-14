"use client";

import { ReactNode, Fragment } from "react";
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
  /** When true, renders a detail row below this row */
  showDetail?: boolean;
  /** Content to render in the detail row */
  detailContent?: ReactNode;
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

function TableHeadRow({ columns }: { columns: GlassTableColumn[] }) {
  return (
    <TableRow className="border-b border-gray-200/80 hover:bg-transparent">
      {columns.map((column) => (
        <TableHead
          key={column.key}
          className={`text-gray-600 font-semibold text-[11px] uppercase tracking-wider px-2 py-1.5 ${column.className || ''}`}
          style={{ width: column.width }}
        >
          {column.header}
        </TableHead>
      ))}
    </TableRow>
  );
}

function SkeletonRow({ columns, skeletonCount }: { columns: GlassTableColumn[], skeletonCount: number }) {
  return (
    <TableBody>
      {[...Array(skeletonCount)].map((_, i) => (
        <TableRow key={i}>
          {columns.map((column) => (
            <TableCell key={`${column.key}-${i}`} className="px-2 py-1.5">
              <Skeleton className="h-3 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}

function EmptyRow({ columns, message }: { columns: GlassTableColumn[], message: string }) {
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={columns.length} className="text-center text-gray-500 px-4 py-12 text-xs">
          {message}
        </TableCell>
      </TableRow>
    </TableBody>
  );
}

function DataRows({ columns, rows }: { columns: GlassTableColumn[], rows: GlassTableRow[] }) {
  return (
    <TableBody>
          {rows.map((row) => (
            <Fragment key={String(row.id)}>
          <TableRow className={`border-b border-gray-200/60 hover:bg-gray-50/50 transition-colors ${row.className || ''}`}>
            {row.cells.map((cell, index) => (
              <TableCell key={`${row.id}-${index}`} className="px-2 py-1.5 text-[11px]">
                {cell}
              </TableCell>
            ))}
          </TableRow>
          {row.showDetail && row.detailContent && (
            <TableRow className="border-b border-gray-200/60 hover:bg-transparent">
              <TableCell colSpan={columns.length} className="p-0">
                <div className="p-4 bg-gray-50/80 rounded-b-lg">
                  {row.detailContent}
                </div>
              </TableCell>
            </TableRow>
          )}
        </Fragment>
      ))}
    </TableBody>
  );
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
  return (
    <div className={`overflow-x-auto ${className}`}>
      <Table>
        <TableHeader>
          <TableHeadRow columns={columns} />
        </TableHeader>
        {loading ? (
          <SkeletonRow columns={columns} skeletonCount={skeletonCount} />
        ) : rows.length === 0 ? (
          emptyState ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center px-4 py-12">
                  {emptyState}
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <EmptyRow columns={columns} message={emptyMessage} />
          )
        ) : (
          <DataRows columns={columns} rows={rows} />
        )}
      </Table>
    </div>
  );
}