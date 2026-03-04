import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { LittleItem } from "@/components/ui/little-item";
import { TypeDecodedSKU, TypeDecodedVariant } from "../types";

export default function StockageField({ field, variants, strat }) {
  const skus: TypeDecodedSKU[] = field.state.value;

  variants = useMemo(
    () => variants.sort((a, b) => a.order - b.order),
    [variants],
  );

  if (strat === "by_variants")
    return <ByVariantsForm variants={variants} field={field} skus={skus} />;
  else if (strat === "by_number") return <ByNumberForm field={field} />;
  else if (strat === "by_demand") return <ByDemandForm field={field} />;
  else return <p>error</p>;
}

function ByNumberForm({ inventoryVariants, field }: any) {
  const fp = "";
  const quantity = inventoryVariants.get(fp)?.quantity ?? 0;

  const changeQuantity = (newQuantity: number) => {
    const newData = new Map();
    newData.set(fp, { quantity: newQuantity, path: [] });
    field.setValue(newData);
  };

  return (
    <div className="rounded-none border border-input-border p-4 bg-muted/50">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-[14px]">Stock global</p>
          <p className="text-[12px] text-neutral-500">
            Définissez une quantité fixe pour ce produit sans distinction de
            variante.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <p className="text-[14px] text-neutral-700">Quantité</p>
          <Input
            type="number"
            onChange={(e) => changeQuantity(Number(e.target.value))}
            placeholder="eg. 100"
            defaultValue={quantity}
            className="text-[14px] py-1 w-24"
          />
        </div>
      </div>
    </div>
  );
}

function ByDemandForm({ field }: any) {
  // For by_demand, we can clear the inventory as it's not used
  const currentVal = field.state.value;
  if (currentVal instanceof Map && currentVal.size > 0) {
    field.setValue(new Map());
  }

  return (
    <div className="rounded-none border border-input-border p-4 bg-muted/50 flex flex-col gap-1">
      <p className="font-semibold text-[14px]">Sur commande</p>
      <p className="text-[13px] text-neutral-500 leading-relaxed">
        Ce produit n'a pas de stock limité. Chaque commande sera traitée à la
        demande. Aucun suivi de stock ne sera effectué pour ce produit.
      </p>
    </div>
  );
}

function ByVariantsForm({
  variants,
  field,
  skus,
}: {
  variants: TypeDecodedVariant[];
  field: any;
  skus: TypeDecodedSKU[];
}) {
  const generatedSKUs = useMemo(
    () => generateSKUs(variants, skus),
    [variants, skus],
  );

  const changeQuantity = (id: string, newQuantity: number) => {
    const newSkus = generatedSKUs.map((sku) => {
      if (sku.tempId === id) return { ...sku, quantity: newQuantity };
      return sku;
    });
    field.setValue(newSkus);
  };

  return (
    <div className="flex flex-col space-y-0 border">
      {generatedSKUs.length > 0 ? (
        generatedSKUs.map((sku, idx) => (
          <div key={sku.tempId}>
            <div className="flex items-center py-3 px-4 gap-4 justify-between">
              <div className="flex gap-4">
                {sku.options.map((option, optIdx) => (
                  <div key={optIdx} className="">
                    <LittleItem>{option.optionName}</LittleItem>
                  </div>
                ))}
              </div>
              <div className="w-24 mr-10">
                <Input
                  type="number"
                  onChange={(e) =>
                    changeQuantity(sku.tempId, Number(e.target.value))
                  }
                  placeholder="0"
                  value={sku.quantity}
                  className="text-[14px] py-1"
                />
              </div>
            </div>
            {idx < generatedSKUs.length - 1 && (
              <div className="w-full flex-1 bg-border h-[1px]" />
            )}
          </div>
        ))
      ) : (
        <div className="p-4">
          <p className="italic text-[14px] text-neutral-500">
            Creez des variantes de produit pour configurer votre stock.
          </p>
        </div>
      )}
    </div>
  );
}

function generateSKUs(
  variants: TypeDecodedVariant[],
  skus: TypeDecodedSKU[],
): TypeDecodedSKU[] {
  if (variants.length === 0) return [];
  if (variants.length === 1) {
    return variants[0].options.map((option) => {
      const existingSku = skus.find(
        (sku) =>
          sku.options.length === 1 && sku.options[0].optionName == option.name,
      );
      const existingOpt = existingSku?.options[0];
      return {
        tempId: existingSku?.tempId ?? crypto.randomUUID(),
        quantity: existingSku?.quantity ?? 0,
        options: [
          {
            tempId: existingOpt?.tempId ?? crypto.randomUUID(),
            optionName: option.name,
            order: option.order,
          },
        ],
      };
    });
  }

  const sortedVariants = variants.sort((a, b) => a.order - b.order);
  const optionLists = sortedVariants.map((v) => v.options);
  const combinations = cartesian(...optionLists);

  return combinations.map((opts) => {
    const options = opts.map((opt, idx) => {
      const existingOpt = skus
        .flatMap((s) => s.options)
        .find((o) => o.optionName === opt.name);
      return {
        tempId: existingOpt?.tempId ?? crypto.randomUUID(),
        optionName: opt.name,
        order: sortedVariants[idx].order,
      };
    });

    const existingSku = skus.find(
      (sku) =>
        sku.options.length === options.length &&
        sku.options.every(
          (skuOpt, i) => skuOpt.optionName === options[i].optionName,
        ),
    );

    return {
      tempId: existingSku?.tempId ?? crypto.randomUUID(),
      quantity: existingSku?.quantity ?? 0,
      options,
    };
  });
}

function cartesian<T>(...arrays: T[][]): T[][] {
  return arrays.reduce(
    (acc, curr) => acc.flatMap((a) => curr.map((b) => [...a, b])),
    [[]] as T[][],
  );
}
