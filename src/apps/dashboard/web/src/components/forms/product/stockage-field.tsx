import { useState } from "react";
import { useFieldContext } from "@/hooks/form-context.tsx";
import { useMutation, useQuery } from "convex/react";
import { api } from "api/convex";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Props = {
  label?: string;
  variants: any
};

export default function StockageField({ label, variants }: Props) {
  console.log("[stockage] variants :", variants)
  const field = useFieldContext<string>();
  const strats = [
    {
      key: "on_demand",
      value: "On Demand"
    },
    {
      key: "by_sizes",
      value: "By Sizes",
    },
    {
      key: "by_number",
      value: "By Number",
    },

  ]
  const currentStrat = field.state.value

  console.log('current start ', field.state)
  return (
    <div className="grid gap-1">
      <Label className="font-semibold pb-[12px]">Starategy</Label>
      <div className="space-y-1">
        <Select
          value={(field.state.value) ?? ""}
          onValueChange={(v) => field.handleChange(v as any)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent className="bg-card">
            {strats.map((c, k) => (
              <SelectItem
                key={k}
                className="focus:bg-black/5"
                value={c.key}
              >
                {c.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function AddIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="9"
      height="9"
      fill="none"
      viewBox="0 0 9 9"
    >
      <path
        stroke="#000"
        strokeLinecap="round"
        strokeWidth="0.818"
        d="M1.023 4.5h6.954M4.5 7.978V1.023"
      />
    </svg>
  );
}
