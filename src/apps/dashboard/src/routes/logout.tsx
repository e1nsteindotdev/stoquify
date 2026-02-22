import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/logout")({
  component: LogoutPage,
});

function LogoutPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    auth.logout().then(() => {
      navigate({ to: "/login" as any });
    });
  }, [navigate, auth]);

  return null;
}
