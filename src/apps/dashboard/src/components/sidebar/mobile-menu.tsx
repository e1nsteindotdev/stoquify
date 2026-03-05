import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { useAppStore } from "@/lib/store";
import { hasStorePermission, hasGlobalPermission } from "@/lib/permissions";
import { mainNavItems, secondaryNavItems, NavItem } from "./nav-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function MobileMenu() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { location } = useRouterState();
  const user = useAppStore((state) => state.user);
  const selectedStore = useAppStore((state) => state.selectedStore);

  const hasAccess = (item: NavItem): boolean => {
    if (!item.requiredPermission) return true;

    if (item.requiredPermission.scope === "global") {
      return hasGlobalPermission(
        user,
        item.requiredPermission.resource,
        item.requiredPermission.action,
      );
    }
    return hasStorePermission(
      user,
      selectedStore?._id,
      item.requiredPermission.resource,
      item.requiredPermission.action,
    );
  };

  const visibleMainItems = mainNavItems.filter(hasAccess);
  const allItems = [...visibleMainItems, ...secondaryNavItems];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="md:hidden fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 20, y: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 20, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
              className="mb-4 w-64 bg-white shadow-2xl overflow-hidden z-50 border border-gray-200 rounded-none"
            >
              <div className="p-3 flex flex-col gap-1.5">
                <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Navigation
                </div>
                {allItems.map((item) => (
                  <Link
                    key={item.title}
                    to={item.url}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 transition-all duration-200 rounded-none",
                      isActive(item.url)
                        ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]"
                        : "text-gray-700 hover:bg-gray-100 hover:translate-x-1",
                    )}
                  >
                    <item.icon size={20} stroke={2} />
                    <span className="font-semibold text-sm">{item.title}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Trigger Button */}
      <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-14 h-14 rounded-none border-none flex items-center justify-center shadow-xl transition-all duration-300 p-0",
            "bg-white text-primary",
          )}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
              >
                <IconX size={34} stroke={2.5} />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
              >
                <IconMenu2 size={34} stroke={2.5} />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>
    </div>
  );
}
