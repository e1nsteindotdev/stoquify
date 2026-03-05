import React from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
  type Row,
  type SortingState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageSize?: number;
  getRowCanExpand?: (row: Row<TData>) => boolean;
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactElement;
  defaultSorting?: SortingState;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageSize = 50,
  getRowCanExpand,
  renderSubComponent,
  defaultSorting = [],
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowCanExpand,
    initialState: {
      pagination: {
        pageSize,
      },
      sorting: defaultSorting,
    },
  });

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => {
                return (
                  <React.Fragment key={row.id}>
                    <TableRow
                      data-state={row.getIsSelected() && "selected"}
                      data-slot="table-row"
                      className={
                        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors " +
                        (index === 0 ? "bg-muted/30 " : "") +
                        (row.getCanExpand()
                          ? "cursor-pointer hover:bg-muted/50"
                          : "")
                      }
                      onClick={() => row.toggleExpanded()}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {row.getIsExpanded() && renderSubComponent && (
                      <TableRow key={`${row.id}-expanded`}>
                        <TableCell
                          colSpan={row.getVisibleCells().length}
                          className="p-0"
                        >
                          {renderSubComponent({ row })}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Aucun résultat.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col items-center gap-4 py-4 sm:flex-row sm:justify-end sm:space-x-4 sm:py-2">
        <div className="order-2 sm:order-1">
          <span className="text-sm text-muted-foreground">
            {table.getRowModel().rows.length} /{" "}
            {table.getFilteredRowModel().rows.length} commandes affichées
          </span>
        </div>
        <div className="flex w-full items-center justify-between space-x-2 px-2 sm:w-auto sm:px-0 order-1 sm:order-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="flex-1 sm:flex-none"
          >
            Précédent
          </Button>
          <span className="text-sm font-medium px-2 whitespace-nowrap">
            {table.getState().pagination.pageIndex + 1} /{" "}
            {table.getPageCount() || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="flex-1 sm:flex-none"
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}
