import { useFieldContext } from "@/hooks/form-context.tsx";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function StockageStratField() {
  const field = useFieldContext<string>();
  const strats = [
    {
      key: "by_demand",
      value: "Par commande"
    },
    {
      key: "by_variants",
      value: "Par variantes",
    },
    {
      key: "by_number",
      value: "Quantité fixe",
    },
  ]

  return (
    <div className="grid gap-1">
      <Label className="font-semibold pb-[12px]">Stratégie</Label>
      <div className="space-y-1">
        <Select
          value={(field.state.value) ?? ""}
          onValueChange={(v) => field.handleChange(v as any)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionner une option" />
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

