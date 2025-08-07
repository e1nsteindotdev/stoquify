import { useForm, type AnyFieldApi } from '@tanstack/react-form'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

import { Input } from "@/components/ui/input"
import { Textarea } from '@/components/ui/textarea'
import { useMutation } from "convex/react";
import { api } from "api/convex"

function FieldInfo({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {field.state.meta.isTouched && !field.state.meta.isValid ? (
        <em>{field.state.meta.errors.join(', ')}</em>
      ) : null}
      {field.state.meta.isValidating ? 'Validating...' : null}
    </>
  )
}
export function CreateProductForm() {

  const productMutation = useMutation(api.products.createTestProduct)
  const form = useForm({
    defaultValues: {
      title: '',
      desc: '',
    },
    onSubmit: async ({ value }) => {
      const response = await productMutation({ title: value.title, desc: value.desc })
      console.log(response)
      // await fetch("http://localhost:8787/admin/products/create", {
      //   method: "POST",
      //   body: JSON.stringify(value)
      // })
      console.log(value)
    },
  })
  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
      >

        <div className="flex flex-col gap-12 w-[400px]">
          <div className="flex flex-col gap-6 w-full">
            <form.Field
              name="title"
              validators={{
                onChange: ({ value }) =>
                  !value
                    ? 'A first name is required'
                    : value.length < 3
                      ? 'First name must be at least 3 characters'
                      : undefined,
              }}
              children={(field) => {
                // Avoid hasty abstractions. Render props are great!
                return (
                  <div className="grid w-full max-w-sm items-center gap-3">
                    <Label htmlFor={field.name}>Product Title</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldInfo field={field} />
                  </div>
                )
              }}
            />

            <form.Field
              name="desc"
              validators={{
                onChange: ({ value }) =>
                  !value
                    ? 'Description is required'
                    : value.length < 3
                      ? 'Description must be at least 3 characters'
                      : undefined,
              }}
              children={(field) => {
                // Avoid hasty abstractions. Render props are great!
                return (
                  <div className="grid w-full max-w-sm items-center gap-3">
                    <Label htmlFor={field.name}>Product Description</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldInfo field={field} />
                  </div>
                )
              }}
            />
          </div>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button type="submit" className="max-w-40" variant="outline" disabled={!canSubmit}>
                {isSubmitting ? '...' : 'Submit'}
              </Button>
            )}
          />
        </div>
      </form>
    </div>
  )
}
