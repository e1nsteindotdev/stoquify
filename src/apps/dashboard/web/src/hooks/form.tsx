import { createFormHook } from '@tanstack/react-form'
import { lazy } from 'react'
import { fieldContext, formContext, useFormContext } from './form-context.tsx'
const TextField = lazy(() => import('@/components/ui/text-field.tsx'))
const TextAreaField = lazy(() => import('@/components/ui/textarea-field.tsx'))
const ImageField = lazy(() => import('@/components/ui/images-field.tsx'))

function SubscribeButton({ label }: { label: string }) {
  const form = useFormContext()
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => <button disabled={isSubmitting}>{label}</button>}
    </form.Subscribe>
  )
}

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldComponents: {
    TextField,
    TextAreaField,
    ImageField
  },
  formComponents: {
    SubscribeButton,
  },
  fieldContext,
  formContext,
})
