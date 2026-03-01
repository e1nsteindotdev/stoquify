import { type Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, Filter, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
  isChoice?: boolean;
  choices?: { label: string; value: string }[];
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
  isChoice,
  choices,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort() && !column.getCanFilter()) {
    return <div className={cn("text-xs font-medium", className)}>{title}</div>;
  }

  const selectedFilters = new Set(column.getFilterValue() as string[]);

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent rounded-none text-xs font-medium"
          >
            <span>{title}</span>
            {column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-3 w-3" />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-3 w-3" />
            ) : (
              <ChevronsUpDown className="ml-2 h-3 w-3" />
            )}
            {!!column.getFilterValue() && (
              <Filter className="ml-2 h-3 w-3 text-primary" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="rounded-none">
          {column.getCanSort() && (
            <>
              <DropdownMenuItem
                className="rounded-none cursor-pointer"
                onClick={() => column.toggleSorting(false)}
              >
                <ArrowUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                Ascendant
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-none cursor-pointer"
                onClick={() => column.toggleSorting(true)}
              >
                <ArrowDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                Descendant
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-none cursor-pointer"
                onClick={() => column.clearSorting()}
              >
                <ChevronsUpDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                Désactiver le tri
              </DropdownMenuItem>
            </>
          )}

          {column.getCanSort() && isChoice && <DropdownMenuSeparator />}

          {isChoice && choices && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="rounded-none cursor-pointer">
                <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                <span>Filtrer</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="rounded-none">
                {choices.map((choice) => (
                  <DropdownMenuCheckboxItem
                    key={choice.value}
                    className="rounded-none cursor-pointer"
                    checked={selectedFilters.has(choice.value)}
                    onCheckedChange={(checked) => {
                      const newFilters = new Set(selectedFilters);
                      if (checked) {
                        newFilters.add(choice.value);
                      } else {
                        newFilters.delete(choice.value);
                      }
                      column.setFilterValue(
                        newFilters.size > 0
                          ? Array.from(newFilters)
                          : undefined,
                      );
                    }}
                  >
                    {choice.label}
                  </DropdownMenuCheckboxItem>
                ))}
                {selectedFilters.size > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="rounded-none cursor-pointer justify-center"
                      onClick={() => column.setFilterValue(undefined)}
                    >
                      <X className="mr-2 h-3.5 w-3.5" />
                      Réinitialiser
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
