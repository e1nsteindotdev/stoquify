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
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";

import { useForm, type AnyFieldApi } from "@tanstack/react-form";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  console.log("login form rendered: ");

  const { signIn } = useAuthActions();
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      email: "einstein@gmail.com",
      password: "admin#123",
    },
    onSubmit: async ({ value }) => {
      try {
        await signIn("password", {
          email: value.email,
          password: value.password,
          flow: "signIn",
        });
        console.log("signed in, waiting for redirect");
      } catch (error) {
        console.error("Login failed:", error);
      }
    },
  });

  const { isAuthenticated } = useConvexAuth();
  console.log("isAuthenticated: ", isAuthenticated);
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={cn("flex flex-col gap-6", className)} {...props}>
          <Card>
            <CardHeader>
              <CardTitle>Login to your account</CardTitle>
              <CardDescription>
                Enter your email below to login to your account
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
                          ? "A first name is required"
                          : value.length < 3
                            ? "First name must be at least 3 characters"
                            : undefined,
                    }}
                    children={(field) => {
                      // Avoid hasty abstractions. Render props are great!
                      return (
                        <div className="grid gap-3">
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
                      );
                    }}
                  />
                  <div className="grid gap-3">
                    <div className="flex items-center">
                      <Label htmlFor={"password"}>Password</Label>
                      <a
                        href="#"
                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </a>
                    </div>

                    <form.Field
                      name="password"
                      validators={{
                        onChange: ({ value }) =>
                          !value
                            ? "A first name is required"
                            : value.length < 3
                              ? "First name must be at least 3 characters"
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
                      Login
                    </Button>
                    <Button variant="outline" className="w-full">
                      Login with Google
                    </Button>
                  </div>
                </div>
                <div className="mt-4 text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <a href="#" className="underline underline-offset-4">
                    Sign up
                  </a>
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
      {field.state.meta.isValidating ? "Validating..." : null}
    </>
  );
}
