import { Input } from "@/components/ui/input";
import { LittleItem } from "@/components/ui/little-item";
import { generateVIFingerPrint, type VariantElement as TVariant, type TVariantsInventory } from "@/hooks/useVariantActions";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export function StockageForm({ strat, variants, variantsInventory }:
  { variants: TVariant[], strat: string, variantsInventory: TVariantsInventory }) {

  const orderedVariants = useMemo(() => variants.sort((a, b) => a.order - b.order), [variants])
  switch (strat) {
    case "by_variants":
      return <ByVariantForm variantsInventory={variantsInventory} variants={orderedVariants} />
  }
}

function ByVariantForm({ variants, variantsInventory }: { variants: TVariant[], variantsInventory: TVariantsInventory }) {
  let data: string[][] = []

  function nest(result: string[], depth: number) {
    if (depth < variants.length - 1)
      return variants[depth].options.map(o => {
        return nest([...result, o.name], depth + 1)
      })
    else {
      data.push(result)
      return result
    }
  }

  if (!variants) {
    return (
      <div className="rounded-2xl border border-input-border p-4">
        <p className="italic text-[14px] text-neutral-500">
          No variants exist for this product yet.
        </p>
      </div>
    )
  } else {
    variants[0]?.options.forEach(v => {
      const result = nest([v.name], 1)
      data.push(result)
    })

    const basePadding = 16
    const lastOption = variants.at(-1)?.options

    return (
      <div className="space-y-3 ">
        {data.map((i, j) => (
          <div className="flex flex-col  space-y-0 border rounded-[16px]" key={j}>
            {i.map((p, q) => <div>
              <div className={cn("flex-1 py-3")} style={{ paddingLeft: `${(q + 1) * basePadding}px` }}>
                <LittleItem key={q}>{p}</LittleItem>
              </div>
              <div className="w-full flex-1 bg-border h-[1px]" />
            </div>
            )}
            {lastOption?.map((p, q) => (
              <div>
                <div className="flex items-center flex-1 py-3 gap-10" style={{ paddingLeft: `${(variants.length) * basePadding}px` }}>
                  <LittleItem key={q}>{p.name}</LittleItem>
                  <QuantityInput path={[...i, p.name]} />
                </div>
                {q < lastOption?.length - 1 && <div className="w-full flex-1 bg-border h-[1px]" />}
              </div>

            ))}
          </div>
        ))}
      </div>
    )
  }
}

function QuantityInput({ path }: { path: string[] }) {
  const fp = generateVIFingerPrint(path)
  return <div className="flex gap-2 items-center">
    <p className="text-[14px] text-neutral-700">Quantity</p>
    <Input placeholder="eg. 4" defaultValue={0} className="text-[14px] py-1" />
  </div>
}


/*
   Map<tempId, { path :  string[] }  ,quantity : number}>
*/
