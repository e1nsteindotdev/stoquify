import { useFieldContext } from "@/hooks/form-context.tsx";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function PricingField() {
  const field = useFieldContext<string>();
  return (
    <div className="grid">
      <Label className="font-semibold pb-[12px]">Prix</Label>
      <Input
        value={field.state.value}
        onChange={e => field.setValue(e.target.value)}
        onBlur={field.handleBlur}
        type="number" placeholder="3500" />
    </div>
  );
}

