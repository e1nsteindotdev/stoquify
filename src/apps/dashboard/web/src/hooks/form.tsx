import { createFormHook } from "@tanstack/react-form";
import { lazy } from "react";
import { fieldContext, formContext, useFormContext } from "./form-context.tsx";

const TextField = lazy(() => import("@/components/ui/text-field.tsx"));
const TextAreaField = lazy(() => import("@/components/ui/textarea-field.tsx"));
const ImageField = lazy(() => import("@/components/forms/product/images-field.tsx"));
const CategoriesField = lazy(() => import("@/components/forms/product/categories-field.tsx"));
const VariantsField = lazy(() => import("@/components/forms/product/variants-field.tsx"));
const StockageField = lazy(() => import("@/components/forms/product/stockage-field.tsx"));
const StockageStratField = lazy(() => import("@/components/forms/product/stockage-strat-field.tsx"));

function SubscribeButton({ label }: { label: string }) {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => <button disabled={isSubmitting}>{label}</button>}
    </form.Subscribe>
  );
}

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldComponents: {
    TextField,
    TextAreaField,
    ImageField,
    CategoriesField,
    VariantsField,
    StockageStratField,
    StockageField
  },
  formComponents: {
    SubscribeButton,
  },
  fieldContext,
  formContext,
});
