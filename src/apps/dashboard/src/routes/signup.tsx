import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Duration, Effect } from "effect";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAppForm } from "@/hooks/form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { runtime } from "@/lib/effect-runtime";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { signup, loginWithMagicLink } = useAuth();
  const [isMagicLinkLogin, setIsMagicLinkLogin] = useState(false);
  const [error, setError] = useState("");
  const errorRef = useRef<string>("");

  useEffect(() => {
    errorRef.current = error;
  }, [error]);

  const form = useAppForm({
    defaultValues: {
      phone: "0540228402",
      name: "ahmed hassaine",
      password: "Pass123",
      organizationName: "einstein org",
      shopName: "nezt",
      token: "",
    },
    onSubmit: ({ value }) => {
      const program = Effect.gen(function* () {
        const eventType = isMagicLinkLogin ? "magic_link_login" : "signup";

        yield* Effect.annotateCurrentSpan({
          "event.type": eventType,
          "auth.phone": value.phone,
          timestamp: Date.now(),
        });

        try {
          if (isMagicLinkLogin) {
            yield* Effect.tryPromise({
              try: () =>
                loginWithMagicLink(
                  value.token,
                  value.phone,
                  value.name,
                  value.password,
                ),
              catch: (e: unknown) => Effect.fail(new Error(String(e))),
            });
          } else {
            yield* Effect.tryPromise({
              try: () =>
                signup({
                  phone: value.phone,
                  name: value.name,
                  password: value.password,
                  organizationName: value.organizationName,
                  shopName: value.shopName,
                }),
              catch: (e: unknown) => Effect.fail(new Error(String(e))),
            });
          }

          yield* Effect.annotateCurrentSpan({
            "auth.status": "success",
          });

          yield* Effect.sync(() => navigate({ to: "/" as any }));
        } catch (e: unknown) {
          yield* Effect.annotateCurrentSpan({
            "auth.status": "failed",
            "auth.error": String(e),
          });

          yield* Effect.sync(() => setError(String(e)));
        }
      }).pipe(
        Effect.catchAll((e) =>
          Effect.annotateCurrentSpan({
            "form.error": String(e),
            "form.status": "failed",
          }).pipe(Effect.andThen(Effect.fail(e))),
        ),
        Effect.withSpan("SignupFormSubmit"),
      );
      return runtime.runPromise(program);
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EEEFEF] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {isMagicLinkLogin ? "Créer votre compte" : "Créer une organisation"}
          </CardTitle>
          <CardDescription>
            {isMagicLinkLogin
              ? "Entrez vos informations pour rejoindre l'organisation"
              : "Commencez votre parcours avec Stoquify"}
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <CardContent className="flex flex-col gap-4">
            {error && (
              <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
                {error}
              </div>
            )}

            {isMagicLinkLogin && (
              <form.AppField
                name="token"
                children={(field) => (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={field.name}>Token d'invitation</Label>
                    <Input
                      id={field.name}
                      type="text"
                      placeholder="Entrez le token d'invitation"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      required
                    />
                  </div>
                )}
              />
            )}

            <form.AppField
              name="phone"
              children={(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>Numéro de téléphone</Label>
                  <Input
                    id={field.name}
                    type="tel"
                    placeholder="+212 6XX XXXX XX"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    required
                  />
                </div>
              )}
            />

            <form.AppField
              name="name"
              children={(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>Nom complet</Label>
                  <Input
                    id={field.name}
                    type="text"
                    placeholder="Votre nom"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    required
                  />
                </div>
              )}
            />

            <form.AppField
              name="password"
              children={(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>Mot de passe</Label>
                  <Input
                    id={field.name}
                    type="password"
                    placeholder="•••• (min 4 caractères)"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    required
                    minLength={4}
                  />
                </div>
              )}
            />

            {!isMagicLinkLogin && (
              <>
                <form.AppField
                  name="organizationName"
                  children={(field) => (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={field.name}>Nom de l'organisation</Label>
                      <Input
                        id={field.name}
                        type="text"
                        placeholder="Nom de votre entreprise"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        required
                      />
                    </div>
                  )}
                />

                <form.AppField
                  name="shopName"
                  children={(field) => (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={field.name}>Nom du shop</Label>
                      <Input
                        id={field.name}
                        type="text"
                        placeholder="Nom de votre premier shop"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        required
                      />
                    </div>
                  )}
                />
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4 lg:mt-10">
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting
                    ? isMagicLinkLogin
                      ? "Création du compte..."
                      : "Création de l'organisation..."
                    : isMagicLinkLogin
                      ? "Créer mon compte"
                      : "Créer mon organisation"}
                </Button>
              )}
            />
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
