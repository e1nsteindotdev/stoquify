import { useFieldContext } from "@/hooks/form-context.tsx";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  label?: string;
  variants: any
};

export default function StockageField({ label, variants }: Props) {
  const field = useFieldContext<string>();
  const strats = [
    {
      key: "on_demand",
      value: "Par commande"
    },
    {
      key: "by_sizes",
      value: "Par variantes",
    },
    {
      key: "by_number",
      value: "Quantite fix",
    },

  ]

  return (
    <div>
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
    </div>
  );
}

