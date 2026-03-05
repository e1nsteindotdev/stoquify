import { useMemo } from "react";
import { useAppForm } from "@/hooks/form";
import { useAppStore } from "@/lib/store";
import { convex } from "@/lib/convex-client";
import { api } from "api/convex";
import { Id } from "api/data-model";
import { queryClient } from "@/lib/ts-query-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClipLoader } from "react-spinners";
import { CheckIcon } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ExpenseCategoryField from "./expense-category-field";
import type { ExpenseWithCategory } from "@/database/expenses";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: ExpenseWithCategory | null;
};

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

export function ExpenseFormModal({ open, onOpenChange, expense }: Props) {
  const selectedStore = useAppStore((state) => state.selectedStore);
  const isNew = !expense;

  const defaultValues = useMemo(
    () => ({
      title: expense?.title ?? "",
      description: expense?.description ?? "",
      cost: expense?.cost ?? 0,
      date: expense
        ? new Date(expense.date).toISOString().split("T")[0]
        : getTodayDate(),
      categoryId:
        expense?.categoryId ??
        (undefined as Id<"expenseCategories"> | undefined),
    }),
    [expense],
  );

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      if (!selectedStore?._id) {
        throw new Error("Veuillez sélectionner une boutique");
      }

      const dateTimestamp = new Date(value.date).getTime();

      if (isNew) {
        await convex.mutation(api.expenses.createExpense, {
          storeId: selectedStore._id,
          title: value.title,
          description: value.description || undefined,
          cost: value.cost,
          date: dateTimestamp,
          categoryId: value.categoryId || undefined,
        });
      } else {
        await convex.mutation(api.expenses.updateExpense, {
          id: expense._id,
          title: value.title,
          description: value.description || undefined,
          cost: value.cost,
          date: dateTimestamp,
          categoryId: value.categoryId || undefined,
        });
      }

      await queryClient.refetchQueries({ queryKey: ["expenses"] });
      onOpenChange(false);
      form.reset(defaultValues);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isNew ? "Ajouter une dépense" : "Modifier la dépense"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.AppField
            name="title"
            children={(field) => (
              <div className="grid gap-2">
                <Label className="font-semibold">Titre</Label>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="e.g. Loyer du mois"
                />
              </div>
            )}
          />

          <form.AppField
            name="description"
            children={(field) => (
              <div className="grid gap-2">
                <Label className="font-semibold">Description (optionnel)</Label>
                <Textarea
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Détails supplémentaires..."
                  className="leading-[1.3]"
                />
              </div>
            )}
          />

          <form.AppField
            name="cost"
            children={(field) => (
              <div className="grid gap-2">
                <Label className="font-semibold">Coût (DZD)</Label>
                <Input
                  type="number"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  onBlur={field.handleBlur}
                  placeholder="0"
                />
              </div>
            )}
          />

          <form.AppField
            name="date"
            children={(field) => (
              <div className="grid gap-2">
                <Label className="font-semibold">Date</Label>
                <Input
                  type="date"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
              </div>
            )}
          />

          <form.AppField
            name="categoryId"
            children={(field) => <ExpenseCategoryField label="Catégorie" />}
          />

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <DialogFooter>
                <AnimatedButton
                  type="submit"
                  className="w-full text-[16px] py-2 bg-primary text-white font-semibold rounded-none disabled:pointer-events-none disabled:bg-primary/50 uppercase"
                  loading={isSubmitting}
                  disabled={!canSubmit}
                  animationComponents={{
                    loading: (
                      <span className="flex items-center gap-2">
                        <ClipLoader size={18} color="currentColor" /> EN
                        COURS...
                      </span>
                    ),
                    done: (
                      <span className="flex items-center gap-2">
                        <CheckIcon className="size-5" /> C'EST BON!
                      </span>
                    ),
                  }}
                >
                  {isNew ? "Ajouter" : "Modifier"}
                </AnimatedButton>
              </DialogFooter>
            )}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
