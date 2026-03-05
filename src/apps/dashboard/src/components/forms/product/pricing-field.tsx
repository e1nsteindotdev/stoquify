import { useFieldContext } from "@/hooks/form-context.tsx";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatNumberInput } from "@/lib/utils";

export default function PricingField() {
  const field = useFieldContext<number>();
  return (
    <div className="grid">
      <Label className="font-semibold pb-[12px]">Prix</Label>
      <Input
        value={field.state.value}
        onChange={(e) => {
          const val = e.target.value;
          field.setValue(val === "" ? 0 : Number(formatNumberInput(val)));
        }}
        onBlur={field.handleBlur}
        type="number"
        placeholder="3500"
      />
    </div>
  );
}
