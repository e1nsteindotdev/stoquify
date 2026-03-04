import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { api } from "api/convex";
import { convex } from "@/lib/convex-client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAppStore } from "@/lib/store";
import { clearIDB } from "@/lib/idb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClipLoader } from "react-spinners";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Smartphone, CheckCircle, XCircle, Clock } from "lucide-react";

export const Route = createFileRoute("/mobile-signin")({
  loader: async () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      return { error: "invalid", message: "Token manquant" };
    }
    const result = await convex.query(api.signInMagicLinks.getByToken, {
      token,
    });

    if ("error" in result) {
      if (result.error === "already_used") {
        return {
          error: "already_used",
          message: "Ce QR code a déjà été utilisé",
          usedAt: result.usedAt,
        };
      }
      if (result.error === "expired") {
        return {
          error: "expired",
          message: "Ce QR code a expiré",
          expiresAt: result.expiresAt,
        };
      }
      if (result.error === "invalid") {
        return { error: "invalid", message: "QR code invalide" };
      }
      if (result.error === "user_not_found") {
        return { error: "user_not_found", message: "Utilisateur introuvable" };
      }
    }

    return {
      valid: true,
      token: result.token,
      user: result.user,
    };
  },
  component: MobileSigninPage,
  pendingComponent: () => (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <ClipLoader size={40} color="#22c55e" />
    </div>
  ),
  errorComponent: ({ error }) => {
    console.error("Mobile sign-in route error:", error);
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center text-red-600">
            <XCircle className="mx-auto mb-4 h-12 w-12" />
            <CardTitle>Une erreur est survenue</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Impossible de charger la page de connexion. Veuillez réessayer.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  },
});

type LoaderData =
  | {
    valid: true;
    token: string;
    user: {
      _id: string;
      name: string;
      email?: string;
      phone: string;
      organizationId: string;
      role: string;
    };
  }
  | {
    error: string;
    message: string;
    usedAt?: number;
    expiresAt?: number;
  };

function MobileSigninPage() {
  const loaderData = Route.useLoaderData() as LoaderData;
  const { signIn } = useAuthActions();

  useEffect(() => {
    // Auto-sign in if token is valid
    if ("valid" in loaderData && loaderData.valid) {
      handleSignIn();
    }
  }, []);

  const handleSignIn = async () => {
    if (!("valid" in loaderData) || !loaderData.valid) return;

    try {
      // Use the dedicated mobile-magic-link provider
      const signinResult = await signIn("mobile-magic-link", {
        token: loaderData.token,
      });
      console.log('signIn result : ', signinResult)
      // Clear local storage to avoid stale data from a previous user
      await clearIDB();

      toast.success("Connexion réussie");
      // Force a full application reload to reset stores and query cache
      window.location.href = "/";
    } catch (error) {
      console.error("Sign-in error:", error);
      toast.error("Erreur lors de la connexion");
    }
  };

  // Error state
  if ("error" in loaderData) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              {loaderData.error === "already_used" ? (
                <CheckCircle className="h-8 w-8 text-red-500" />
              ) : loaderData.error === "expired" ? (
                <Clock className="h-8 w-8 text-orange-500" />
              ) : (
                <XCircle className="h-8 w-8 text-red-500" />
              )}
            </div>
            <CardTitle className="text-xl">
              {loaderData.error === "already_used"
                ? "QR code déjà utilisé"
                : loaderData.error === "expired"
                  ? "QR code expiré"
                  : "QR code invalide"}
            </CardTitle>
            <CardDescription className="mt-2">
              {loaderData.message}
              {loaderData.usedAt && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Utilisé le{" "}
                  {new Date(loaderData.usedAt).toLocaleString("fr-FR")}
                </p>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Veuillez demander à l'utilisateur de générer un nouveau QR code
              depuis son compte.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid token - show signing in state
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-gray-50 to-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Smartphone className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-xl">Connexion en cours</CardTitle>
          <CardDescription className="mt-2">
            Connexion au compte de <strong>{loaderData.user.name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <ClipLoader size={32} color="#22c55e" />
          <p className="text-sm text-muted-foreground">
            Veuillez patienter pendant que nous établissons la connexion...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
