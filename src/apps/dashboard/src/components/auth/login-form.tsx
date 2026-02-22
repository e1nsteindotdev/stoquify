import { useNavigate } from "@tanstack/react-router";
import { Effect } from "effect";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

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

const AUTH_LOGOUT_REASON_KEY = "stoquify_auth_logout_reason";

export function LoginForm() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [error, setError] = useState("");
  const errorRef = useRef<string>("");

  useEffect(() => {
    errorRef.current = error;
  }, [error]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reason = window.sessionStorage.getItem(AUTH_LOGOUT_REASON_KEY);
    if (reason === "session_expired") {
      toast.error("Session expired. Please log in again to resume syncing.");
      window.sessionStorage.removeItem(AUTH_LOGOUT_REASON_KEY);
    }
  }, []);

  const form = useAppForm({
    defaultValues: {
      phone: "0540228402",
      password: "Pass123",
    },
    onSubmit: ({ value }) => {
      const program = Effect.gen(function* () {
        yield* Effect.annotateCurrentSpan({
          "event.type": "login",
          "auth.method": "password",
          "auth.phone": value.phone,
          timestamp: Date.now(),
        });

        try {
          yield* Effect.tryPromise({
            try: () => auth.login(value.phone, value.password),
            catch: (e: unknown) => Effect.fail(new Error(String(e))),
          });

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
        Effect.withSpan("LoginFormSubmit"),
      );
      return runtime.runPromise(program);
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EEEFEF] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connexion</CardTitle>
          <CardDescription>
            Entrez votre numero de telephone et mot de passe
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
            <form.AppField
              name="phone"
              children={(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>Numero de telephone</Label>
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
              name="password"
              children={(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>Mot de passe</Label>
                  <Input
                    id={field.name}
                    type="password"
                    placeholder="••••"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    required
                  />
                </div>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4 lg:pt-10">
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? "Connexion..." : "Se connecter"}
                </Button>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => navigate({ to: "/signup" as any })}
            >
              Pas de compte ? Creer une organisation
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
