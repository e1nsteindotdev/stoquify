import { type Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, Filter, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
  explanation?: string;
  isChoice?: boolean;
  choices?: { label: string; value: string }[];
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  explanation,
  className,
  isChoice,
  choices,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const selectedFilters = new Set(column.getFilterValue() as string[]);
  const hasFilterOptions = isChoice && choices && choices.length > 0;
  const canSort = column.getCanSort();
  const canFilter = column.getCanFilter();

  if (!canSort && !canFilter) {
    const content = (
      <div className={cn("text-xs font-medium", className)}>{title}</div>
    );

    if (explanation) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px]">
              {explanation}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  }

  if (canSort && !hasFilterOptions) {
    const content = (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 hover:bg-transparent hover:text-foreground rounded-none text-xs font-medium"
        onClick={() => column.toggleSorting()}
      >
        <span>{title}</span>
        {column.getIsSorted() === "desc" && (
          <ArrowDown className="ml-2 h-3 w-3" />
        )}
        {column.getIsSorted() === "asc" && <ArrowUp className="ml-2 h-3 w-3" />}
      </Button>
    );

    if (explanation) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px]">
              {explanation}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  }

  const trigger = (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent hover:bg-transparent hover:text-foreground rounded-none text-xs font-medium"
    >
      <span>{title}</span>
      {column.getIsSorted() === "desc" ? (
        <ArrowDown className="ml-2 h-3 w-3" />
      ) : column.getIsSorted() === "asc" ? (
        <ArrowUp className="ml-2 h-3 w-3" />
      ) : (
        <Filter
          className={cn(
            "ml-2 h-2.5 w-2.5",
            column.getFilterValue() ? "text-primary" : "text-muted-foreground",
          )}
        />
      )}
    </Button>
  );

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        {explanation ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px]">
                {explanation}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        )}
        <DropdownMenuContent align="start" className="rounded-none">
          {hasFilterOptions && choices && (
            <>
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
                      newFilters.size > 0 ? Array.from(newFilters) : undefined,
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
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
