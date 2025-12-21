import { useFieldContext } from "@/hooks/form-context.tsx";
import { LittleItem } from "@/components/ui/little-item";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { generateVIFingerPrint, mapsDeepEqual, type VariantElement as TVariant, type TVariantsInventory } from "@/hooks/useVariantActions";
import { Input } from "@/components/ui/input";

type Props = {
  variants: TVariant[]
  strat: string
};

export default function StockageField({ variants, strat }: Props) {
  const field = useFieldContext<TVariantsInventory>();
  const inventoryVariants = field.state.value

  variants = useMemo(() => variants.sort((a, b) => a.order - b.order), [variants])

  if (strat === "by_variants") return <ByVariantsForm variants={variants} field={field} inventoryVariants={inventoryVariants} />
  else if (strat === "by_number") return <ByNumberForm field={field} inventoryVariants={inventoryVariants} />
  else if (strat === "by_demand") return <ByDemandForm field={field} />
  else return <p>error</p>

}


function ByNumberForm({ inventoryVariants, field }: any) {
  const fp = ""
  const quantity = inventoryVariants.get(fp)?.quantity ?? 0

  const changeQuantity = (newQuantity: number) => {
    const newData: TVariantsInventory = new Map()
    newData.set(fp, { quantity: newQuantity, path: [] })
    field.setValue(newData)
  }

  return (
    <div className="rounded-2xl border border-input-border p-4 bg-muted/50">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-[14px]">Stock global</p>
          <p className="text-[12px] text-neutral-500">Définissez une quantité fixe pour ce produit sans distinction de variante.</p>
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
  )
}

function ByDemandForm({ field }: any) {
  // For by_demand, we can clear the inventory as it's not used
  const currentVal = field.state.value
  if (currentVal instanceof Map && currentVal.size > 0) {
    field.setValue(new Map())
  }

  return (
    <div className="rounded-2xl border border-input-border p-4 bg-muted/50 flex flex-col gap-1">
      <p className="font-semibold text-[14px]">Sur commande</p>
      <p className="text-[13px] text-neutral-500 leading-relaxed">
        Ce produit n'a pas de stock limité. Chaque commande sera traitée à la demande. 
        Aucun suivi de stock ne sera effectué pour ce produit.
      </p>
    </div>
  )
}


function QuantityInput({ fp, initialQuantity, changeQuantity }: { initialQuantity: number, fp: string, changeQuantity: (a: string, b: number) => void, path: string[] }) {
  return <div className="flex gap-2 items-center">
    <p className="text-[14px] text-neutral-700">Quantité</p>
    <Input onChange={(e) => changeQuantity(fp, Number(e.target.value))} placeholder="eg. 4" defaultValue={initialQuantity} className="text-[14px] py-1" />
  </div>
}



function ByVariantsForm({ variants, inventoryVariants, field }: any) {

  const changeQuantity = function changeQuantity(fp: string, quantity: number) {
    field.setValue(prev => {
      const prevContent = prev.get(fp)
      if (prevContent)
        prev.set(fp, { ...prevContent, quantity })
      return prev
    })
  }

  // if variants changed, we re-calculate paths and fullPaths
  const data = useMemo(() => {
    const data: TVariantsInventory = new Map()
    function nest(result: string[], depth: number) {
      if (depth <= variants.length - 1)
        return variants[depth].options.map(o => {
          return nest([...result, o.name], depth + 1)
        })
      else {
        const fp = generateVIFingerPrint(result)
        data.set(fp, { quantity: inventoryVariants.get(fp)?.quantity ?? 0, path: result })
        return result
      }
    }


    variants[0]?.options.forEach(v => {
      nest([v.name], 1)
    })

    return data
  }, [variants])

  const paths = useMemo(() => {
    const paths: string[][] = []
    function gen_paths(result: string[], depth: number) {
      if (depth < variants.length - 1)
        return variants[depth].options.map(o => {
          return gen_paths([...result, o.name], depth + 1)
        })
      else {
        paths.push(result)
        return result
      }
    }
    variants[0]?.options.forEach(v => {
      gen_paths([v.name], 1)
    })
    return paths
  }, [data])

  const basePadding = 16
  const lastOption = variants.at(-1)?.options
  if (!mapsDeepEqual(data, field.state.value)) {
    field.setValue(data)
  }
  return (
    <div className="space-y-3 ">
      {variants.length > 0 ?
        paths.map((path, j) => (
          <div className="flex flex-col  space-y-0 border rounded-[16px]" key={j}>
            {variants.length > 1 ?
              path.map((leaf: string, q) => <div key={q}>
                <div className={cn("flex-1 py-3")} style={{ paddingLeft: `${(q + 1) * basePadding}px` }}>
                  <LittleItem>{leaf}</LittleItem>
                </div>
                <div className="w-full flex-1 bg-border h-[1px]" />
              </div>
              ) :
              <div>
                <div className="flex items-center flex-1 py-3 gap-10" style={{ paddingLeft: `${(variants.length) * basePadding}px` }}>
                  <LittleItem key={path[0]}>{path[0]}</LittleItem>
                  <QuantityInput
                    fp={generateVIFingerPrint([...path])}
                    initialQuantity={data.get(generateVIFingerPrint([...path]))?.quantity ?? 0}
                    changeQuantity={changeQuantity} path={[...path]} />
                </div>
              </div>
            }

            {variants.length > 1 &&
              lastOption?.map((p, q) => {
                const fp = generateVIFingerPrint([...path, p.name])
                return (
                  <div key={fp}>
                    <div className="flex items-center flex-1 py-3 gap-10" style={{ paddingLeft: `${(variants.length) * basePadding}px` }}>
                      <LittleItem>{p.name}</LittleItem>
                      <QuantityInput
                        fp={generateVIFingerPrint([...path, p.name])}
                        initialQuantity={data.get(generateVIFingerPrint([...path, p.name]))?.quantity ?? 0}
                        changeQuantity={changeQuantity} path={[...path, p.name]} />
                    </div>
                    {q < lastOption?.length - 1 && <div className="w-full flex-1 bg-border h-[1px]" />}
                  </div>
                )
              })}
          </div>
        )) :
        <div className="rounded-2xl border border-input-border p-4">
          <p className="italic text-[14px] text-neutral-500">
            No variants exist for this product yet.
          </p>
        </div>
      }
    </div>
  )

}
