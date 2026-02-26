import { useStore } from '@tanstack/react-form'
import { useFieldContext } from '@/hooks/form-context.tsx'
import { Label } from '@radix-ui/react-label'
import { Input } from './input'

type TextFieldPropsType = { isNumber?: boolean, label?: string } & React.ComponentProps<"input">

export default function TextField({ isNumber = false, label, className, type, ...props }: TextFieldPropsType) {
  const field = useFieldContext<string | number>()
  const errors = useStore(field.store, (state) => state.meta.errors)
  return (
    <div className="grid gap-2">
      {label && <Label className="font-semibold">{label}</Label>}
      <Input
        value={field.state.value}
        onChange={(e) => field.handleChange(isNumber ? Number(e.target.value) : e.target.value)}
        onBlur={field.handleBlur}
        {...props}
      />
      {errors.map((error: string) => (
        <div key={error} style={{ color: 'red' }}>
          {error}
        </div>
      ))}
    </div>
  )
}

