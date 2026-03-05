import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { convex } from "@/lib/convex-client";
import { api } from "api/convex";
import { useAppStore } from "@/lib/store";

import { useForm, type AnyFieldApi } from "@tanstack/react-form";
import { useAuthActions } from "@convex-dev/auth/react";
import type { Dispatch, SetStateAction } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function SignUpForm({
  step,
  setStep,
  className,
  ...props
}: {
  step: string;
  setStep: Dispatch<SetStateAction<string>>;
} & React.ComponentProps<"div">) {
  const { signIn } = useAuthActions();

  const setStores = useAppStore((state) => state.setStores);
  const setUser = useAppStore((state) => state.setUser);

  const form = useForm({
    defaultValues: {
      storeName: "Ma Boutique",
      email: "einstein@gmail.com",
      phone: "0550000000",
      name: "Founder",
      password: "&c_jJC}<Tw!&_)4g",
    },
    onSubmit: async ({ value }) => {
      try {
        const signUpResult = await signIn("phone", {
          ...value,
          role: "founder",
          flow: step,
        });

        if (
          signUpResult &&
          typeof signUpResult === "object" &&
          "error" in signUpResult
        ) {
          const errorMsg = String(signUpResult.error);
          toast.error(errorMsg || "Erreur lors de la création du compte");
          return;
        }

        const stores = await convex.query(api.stores.list);
        const user = await convex.query(api.users.getUserData);
        setStores(stores);
        setUser(user);

        toast.success("Compte créé avec succès");
      } catch (error) {
        console.error("error while trying to sign up :", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de la création du compte";
        toast.error(errorMessage);
      }
    },
  });

  return (
    <div className="flex w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={cn("flex flex-col gap-6", className)} {...props}>
          <Card>
            <CardHeader>
              <CardTitle className="text-[20px]">
                Créer un nouveau compte
              </CardTitle>
              <CardDescription>
                Remplissez le formulaire ci-dessous pour créer un nouveau compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
              >
                <div className="flex flex-col gap-6">
                  <form.Field
                    name="name"
                    validators={{
                      onChange: ({ value }) =>
                        !value ? "Votre nom complet est requis" : undefined,
                    }}
                    children={(field) => {
                      return (
                        <div className="grid gap-3">
                          <Label htmlFor={field.name}>Nom complet</Label>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                          <FieldInfo field={field} />
                        </div>
                      );
                    }}
                  />
                  <form.Field
                    name="phone"
                    validators={{
                      onChange: ({ value }) =>
                        !value
                          ? "Un numéro de téléphone est requis"
                          : undefined,
                    }}
                    children={(field) => {
                      return (
                        <div className="grid gap-3">
                          <Label htmlFor={field.name}>
                            Numéro de téléphone
                          </Label>
                          <Input
                            id={field.name}
                            name={field.name}
                            type="tel"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                          <FieldInfo field={field} />
                        </div>
                      );
                    }}
                  />
                  <form.Field
                    name="email"
                    validators={{
                      onChange: ({ value }) =>
                        !value
                          ? "Un email est requis"
                          : value.length < 3
                            ? "L'email doit contenir au moins 3 caractères"
                            : undefined,
                    }}
                    children={(field) => {
                      return (
                        <div className="grid gap-3">
                          <Label htmlFor={field.name}>Email</Label>
                          <Input
                            id={field.name}
                            name={field.name}
                            type="email"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                          <FieldInfo field={field} />
                        </div>
                      );
                    }}
                  />
                  <form.Field
                    name="storeName"
                    validators={{
                      onChange: ({ value }) =>
                        !value
                          ? "Un nom de boutique est requis"
                          : value.length < 3
                            ? "Le nom de boutique doit contenir au moins 3 caractères"
                            : undefined,
                    }}
                    children={(field) => {
                      return (
                        <div className="grid gap-3">
                          <Label htmlFor={field.name}>Nom de la boutique</Label>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                          <FieldInfo field={field} />
                        </div>
                      );
                    }}
                  />
                  <div className="grid gap-3">
                    <div className="flex items-center">
                      <Label htmlFor={"password"}>Mot de passe</Label>
                    </div>

                    <form.Field
                      name="password"
                      validators={{
                        onChange: ({ value }) =>
                          !value
                            ? "Un mot de passe est requis"
                            : value.length < 3
                              ? "Le mot de passe doit contenir au moins 4 caractères"
                              : undefined,
                      }}
                      children={(field) => {
                        // Avoid hasty abstractions. Render props are great!
                        return (
                          <div className="grid gap-3">
                            <Input
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              type="password"
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                            />
                            <FieldInfo field={field} />
                          </div>
                        );
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <form.Subscribe
                      selector={(state) => [
                        state.canSubmit,
                        state.isSubmitting,
                      ]}
                      children={([canSubmit, isSubmitting]) => (
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={!canSubmit || isSubmitting}
                        >
                          {isSubmitting && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          S&apos;inscrire
                        </Button>
                      )}
                    />
                  </div>
                </div>
                <div className="mt-4 text-center text-sm">
                  Vous avez déjà un compte ?{" "}
                  <button
                    onClick={() => setStep("signIn")}
                    className="underline underline-offset-4"
                  >
                    Se connecter
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FieldInfo({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {field.state.meta.isTouched && !field.state.meta.isValid ? (
        <em>{field.state.meta.errors.join(", ")}</em>
      ) : null}
      {field.state.meta.isValidating ? "Validation..." : null}
    </>
  );
}
