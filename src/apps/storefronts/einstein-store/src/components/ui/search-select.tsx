import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function SearchSelect({ options }: { options: { htmlName: string, name: string }[] }) {
  return (
    <Select>
      <SelectTrigger className="w-full">
        <SelectValue defaultValue={"Algiers"} placeholder="Wilaya" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup defaultValue={"Algiers"}>
          {options.map(option =>
            <SelectItem value={option.name} key={option.name}>{option.htmlName}</SelectItem>
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  )

}





