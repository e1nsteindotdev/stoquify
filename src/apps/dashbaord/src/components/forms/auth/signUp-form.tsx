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

import { useForm, type AnyFieldApi } from "@tanstack/react-form";
import { useAuthActions } from "@convex-dev/auth/react";
import type { Dispatch, SetStateAction } from "react";

export function SignUpForm({ step, setStep, className, ...props }: { step: string, setStep: Dispatch<SetStateAction<string>> } & React.ComponentProps<"div">) {
  const { signIn } = useAuthActions();

  const form = useForm({
    defaultValues: {
      organizationName: "nezt",
      email: "einstein@gmail.com",
      password: "&c_jJC}<Tw!&_)4g",
    },
    onSubmit: async ({ value }) => {
      try {
        await signIn("password", { ...value, flow: step });
      } catch (error) {
        console.error("error while trying to sign up :", error)
      }
    },
  });

  return (
    <div className="flex w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={cn("flex flex-col gap-6", className)} {...props}>
          <Card>
            <CardHeader>
              <CardTitle className="text-[20px]">Créer un nouveau compte</CardTitle>
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
                      // Avoid hasty abstractions. Render props are great!
                      return (
                        <div className="grid gap-3">
                          <Label htmlFor={field.name}>Email</Label>
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
                    name="organizationName"
                    validators={{
                      onChange: ({ value }) =>
                        !value
                          ? "Un nom d'entreprise est requis"
                          : value.length < 3
                            ? "Le nom d'entreprise doit contenir au moins 3 caractères"
                            : undefined,
                    }}
                    children={(field) => {
                      // Avoid hasty abstractions. Render props are great!
                      return (
                        <div className="grid gap-3">
                          <Label htmlFor={field.name}>Nom de votre entreprise</Label>
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
                    <Button type="submit" className="w-full">
                      S&apos;inscrire
                    </Button>
                  </div>
                </div>
                <div className="mt-4 text-center text-sm">
                  Vous avez déjà un compte ?{" "}
                  <button onClick={() => setStep("signIn")} className="underline underline-offset-4">
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
