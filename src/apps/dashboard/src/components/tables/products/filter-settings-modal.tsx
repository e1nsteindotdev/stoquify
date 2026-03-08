import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings2 } from "lucide-react";
import {
  FilterThresholds,
  DEFAULT_THRESHOLDS,
} from "@/database/products-table";

interface FilterSettingsModalProps {
  thresholds: FilterThresholds;
  onSave: (thresholds: FilterThresholds) => void;
}

export function FilterSettingsModal({
  thresholds,
  onSave,
}: FilterSettingsModalProps) {
  const [open, setOpen] = useState(false);
  const [localThresholds, setLocalThresholds] =
    useState<FilterThresholds>(thresholds);

  useEffect(() => {
    if (open) {
      setLocalThresholds(thresholds);
    }
  }, [open, thresholds]);

  const handleChange = (key: keyof FilterThresholds, value: string) => {
    const numValue = value === "" ? 0 : Number(value);
    if (!isNaN(numValue)) {
      setLocalThresholds((prev) => ({ ...prev, [key]: numValue }));
    }
  };

  const handleSave = () => {
    onSave(localThresholds);
    setOpen(false);
  };

  const handleReset = () => {
    setLocalThresholds(DEFAULT_THRESHOLDS);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
          <Settings2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configuration des filtres</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="highPerformers" className="col-span-3">
              Performants: Taux de vente {">"} (%)
            </Label>
            <Input
              id="highPerformers"
              type="number"
              value={localThresholds.highPerformers}
              onChange={(e) => handleChange("highPerformers", e.target.value)}
              className="col-span-1"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lowStockQty" className="col-span-3">
              Stock faible: Quantité {"<="}
            </Label>
            <Input
              id="lowStockQty"
              type="number"
              value={localThresholds.lowStockQty}
              onChange={(e) => handleChange("lowStockQty", e.target.value)}
              className="col-span-1"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lowStockDays" className="col-span-3">
              Stock faible: Jours de couverture {"<"}
            </Label>
            <Input
              id="lowStockDays"
              type="number"
              value={localThresholds.lowStockDays}
              onChange={(e) => handleChange("lowStockDays", e.target.value)}
              className="col-span-1"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="deadStock" className="col-span-3">
              Stock mort: Jours sans vente {">"}
            </Label>
            <Input
              id="deadStock"
              type="number"
              value={localThresholds.deadStock}
              onChange={(e) => handleChange("deadStock", e.target.value)}
              className="col-span-1"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lowMargin" className="col-span-3">
              Marge faible: Marge {"<"} (%)
            </Label>
            <Input
              id="lowMargin"
              type="number"
              value={localThresholds.lowMargin}
              onChange={(e) => handleChange("lowMargin", e.target.value)}
              className="col-span-1"
            />
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <Button variant="ghost" onClick={handleReset}>
            Réinitialiser
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave}>Enregistrer</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
