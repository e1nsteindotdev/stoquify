import { createFileRoute, redirect } from "@tanstack/react-router";
import { api } from "api/convex";
import { convex } from "@/lib/convex-client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClipLoader } from "react-spinners";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/magic-link")({
  loader: async () => {
    const params = new URLSearchParams(window.location.search);
    const magicLinkId = params.get("magicLinkId");
    if (!magicLinkId) {
      throw redirect({ to: "/" });
    }

    const magicLink = await convex.query(api.magicLinks.getById, {
      magicLinkId: magicLinkId as any,
    });

    if (!magicLink) {
      throw redirect({ to: "/" });
    }

    if ("error" in magicLink) {
      if (magicLink.error === "already_used") {
        return { error: "already_used", message: "Ce lien a déjà été utilisé" };
      }
      if (magicLink.error === "expired") {
        return { error: "expired", message: "Ce lien a expiré" };
      }
      throw redirect({ to: "/" });
    }

    return {
      magicLink: {
        _id: magicLink._id,
        role: magicLink.role,
        permissions: magicLink.permissions,
        organizationId: magicLink.organizationId,
      },
    };
  },
  component: MagicLinkPage,
});

type MagicLinkData =
  | {
    magicLink: {
      _id: string;
      role: string;
      permissions: any[];
      organizationId: string;
    };
  }
  | {
    error: string;
    message: string;
  };

function MagicLinkPage() {
  const loaderData = Route.useLoaderData() as MagicLinkData;
  const { signIn } = useAuthActions();
  const setStores = useAppStore((state) => state.setStores);
  const setUser = useAppStore((state) => state.setUser);
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if ("error" in loaderData) {
    return (
      <div className="flex w-full items-center justify-center p-6 md:p-10">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-[20px] text-red-500">Erreur</CardTitle>
            <CardDescription>{loaderData.message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { magicLink } = loaderData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn("phone", {
        phone,
        name,
        ...(email ? { email } : {}),
        password,
        magicLinkId: magicLink._id,
        flow: "signUp"
      });

      const stores = await convex.query(api.stores.list);
      const user = await convex.query(api.users.getUserData);
      setStores(stores);
      setUser(user);

      toast.success("Compte créé avec succès");
      window.location.href = "/";
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Erreur lors de la création du compte");
    } finally {
      setIsLoading(false);
    }
  };

  const roleLabels: Record<string, string> = {
    founder: "Fondateur",
    admin: "Administrateur",
    staff: "Staff",
  };

  return (
    <div className="flex w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-[20px]">Créer votre compte</CardTitle>
            <CardDescription>
              Vous avez été invité en tant que {roleLabels[magicLink.role]}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email (optionnel)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <ClipLoader size={16} /> : "Créer mon compte"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
