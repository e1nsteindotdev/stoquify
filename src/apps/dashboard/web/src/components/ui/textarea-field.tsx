import { useStore } from '@tanstack/react-form'
import { useFieldContext } from '@/hooks/form-context.tsx'
import { Label } from '@radix-ui/react-label'
import { Textarea } from './textarea'

type TextFieldPropsType = { label?: string } & React.ComponentProps<"textarea">

export default function TextField({ label, className, ...props }: TextFieldPropsType) {
  const field = useFieldContext<string>()
  const errors = useStore(field.store, (state) => state.meta.errors)
  return (
    <div className="grid gap-2">
      {label && <Label className="font-semibold">{label}</Label>}
      <Textarea
        id={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
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

