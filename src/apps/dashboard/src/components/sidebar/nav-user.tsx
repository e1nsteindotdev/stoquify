import {
  ChevronsUpDown,
  LogOut,
  Sparkles,
  Building2,
  Store,
  Plus,
  Check,
  Smartphone,
  RefreshCw,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useNavigate } from "@tanstack/react-router";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAppStore } from "@/lib/store";
import { clearIDB } from "@/lib/idb";
import { useEffect, useState } from "react";
import { CreateStoreForm } from "@/components/forms/store/create-store-form";
import { hasGlobalPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import QRCode from "react-qr-code";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "api/convex";
import { convex } from "@/lib/convex-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function NavUser({ avatar }: { avatar: string }) {

  const user = useAppStore((get) => get.user);
  const stores = useAppStore((state) => state.stores);
  const store = useAppStore((state) => state.selectedStore);
  const setStore = useAppStore((state) => state.setStore);

  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const { signOut } = useAuthActions();
  const [createStoreOpen, setCreateStoreOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!store && stores.length != 0)
      setStore(stores[0]);
  }, [])

  // Query for active sign-in magic link
  const { data: activeLink, isLoading: isLoadingLink } = useQuery({
    queryKey: ["signInMagicLink"],
    queryFn: async () => {
      return await convex.query(api.signInMagicLinks.getActiveForCurrentUser);
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Mutation to create new sign-in link
  const createLinkMutation = useMutation({
    mutationFn: async () => {
      return await convex.mutation(api.signInMagicLinks.create);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signInMagicLink"] });
    },
  });

  const handleGenerateLink = () => {
    createLinkMutation.mutate();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "used":
        return "bg-red-500";
      case "expired":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Actif";
      case "used":
        return "Utilisé";
      case "expired":
        return "Expiré";
      default:
        return "Inconnu";
    }
  };

  const canCreateStore =
    hasGlobalPermission(user, "stores", "create") ||
    hasGlobalPermission(user, "stores", "write") ||
    hasGlobalPermission(user, "*", "*");

  useEffect(() => {
    if (!store && stores.length != 0)
      setStore(stores[0]);
  }, [])

  if (!user) {
    console.log('[NAV-USER] no user')
    // void signOut();
    return null;
  }
  console.log('[NAV-USER] user')

  const handleSignOut = async () => {
    await clearIDB();
    await signOut();
    navigate({ to: "/" });
  };

  const handleStoreSwitch = (selectedStore: (typeof stores)[0]) => {
    setStore(selectedStore);
  };


  const base_url = import.meta.env.VITE_BASE_URL?.replace(/\/$/, "");

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">AM</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {store?.name}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={avatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.phoneNumber}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem disabled>
                  <Building2 className="mr-2 h-4 w-4" />
                  <span className="flex-1">{user?.organization?.name}</span>
                  {user.role && (
                    <span className="text-xs text-muted-foreground capitalize">
                      ({user.role})
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Store className="mr-2 h-4 w-4" />
                  <span className="flex-1">{store?.name}</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Sparkles />
                  Upgrade to Pro
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Smartphone className="mr-2 h-4 w-4" />
                    Connexion mobile
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-64">
                    <div className="p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-medium">
                          QR Code de connexion
                        </span>
                        {activeLink && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-white",
                              getStatusColor(activeLink.status),
                            )}
                          >
                            {getStatusText(activeLink.status)}
                          </Badge>
                        )}
                      </div>

                      {activeLink?.status === "active" ? (
                        <>
                          <div className="mb-3 flex justify-center rounded-lg bg-white p-3">
                            <QRCode
                              value={`${base_url}/mobile-signin?token=${activeLink.token}`}
                              size={160}
                            />
                          </div>
                          <p className="mb-3 text-center text-xs text-muted-foreground">
                            Scannez ce QR code avec un autre appareil pour vous
                            connecter
                          </p>
                          {activeLink.expiresAt && (
                            <p className="mb-3 text-center text-xs text-muted-foreground">
                              Expire le{" "}
                              {new Date(
                                activeLink.expiresAt,
                              ).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="mb-3 rounded-lg border border-dashed border-gray-300 p-6 text-center">
                          <p className="text-sm text-muted-foreground">
                            {activeLink?.status === "used"
                              ? "Ce QR code a été utilisé"
                              : activeLink?.status === "expired"
                                ? "Ce QR code a expiré"
                                : "Aucun QR code actif"}
                          </p>
                        </div>
                      )}

                      <Button
                        onClick={handleGenerateLink}
                        disabled={createLinkMutation.isPending}
                        className="w-full"
                        size="sm"
                      >
                        {createLinkMutation.isPending ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        {activeLink ? "Régénérer" : "Générer"}
                      </Button>
                    </div>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Store className="mr-2 h-4 w-4" />
                    Changer de boutique
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {stores.map((s) => (
                      <DropdownMenuItem
                        key={s._id}
                        onClick={() => handleStoreSwitch(s)}
                      >
                        <span className="flex-1">{s.name}</span>
                        {store?._id === s._id && <Check className="h-4 w-4" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem
                  disabled={!canCreateStore}
                  onClick={() => setCreateStoreOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Créer une boutique
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <CreateStoreForm
        open={createStoreOpen}
        onOpenChange={setCreateStoreOpen}
      />
    </>
  );
}
