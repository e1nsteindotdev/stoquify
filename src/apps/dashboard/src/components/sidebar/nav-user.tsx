import {
  ChevronsUpDown,
  LogOut,
  Sparkles,
  Building2,
  Store,
  Plus,
  Check,
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
import { useState } from "react";
import { CreateStoreForm } from "@/components/forms/store/create-store-form";
import { hasGlobalPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export function NavUser({ avatar }: { avatar: string }) {
  const user = useAppStore((get) => get.user);
  const stores = useAppStore((state) => state.stores);
  const store = useAppStore((state) => state.selectedStore);
  const setStore = useAppStore((state) => state.setStore);

  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const { signOut } = useAuthActions();
  const [createStoreOpen, setCreateStoreOpen] = useState(false);

  const canCreateStore =
    hasGlobalPermission(user, "stores", "create") ||
    hasGlobalPermission(user, "stores", "write") ||
    hasGlobalPermission(user, "*", "*");

  if (!store) setStore(stores[0]);
  if (!user) {
    void signOut();
    return null;
  }

  const handleSignOut = async () => {
    await clearIDB();
    await signOut();
    navigate({ to: "/" });
  };

  const handleStoreSwitch = (selectedStore: (typeof stores)[0]) => {
    setStore(selectedStore);
  };

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
