import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/components/forms/auth/login-form";

export function Page() {
  return <LoginForm />;
}

export const Route = createFileRoute("/sign-in")({
  component: Page,
});
