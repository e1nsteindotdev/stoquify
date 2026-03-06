import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { IconMenu2, IconX, IconArrowLeft } from "@tabler/icons-react";
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

  const isSubRoute = !allItems.some((item) => item.url === location.pathname);

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
            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
              className="mb-4 w-64 bg-white shadow-lg overflow-hidden z-50 border border-neutral-200 rounded-none"
            >
              <div className="flex flex-col divide-y divide-neutral-100">
                {allItems.map((item) => (
                  <Link
                    key={item.title}
                    to={item.url}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-5 py-3.5 transition-all duration-200 rounded-none",
                      isActive(item.url)
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-gray-100 hover:pl-6",
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

      {/* Go Back Button */}
      <AnimatePresence>
        {isSubRoute && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            className="mb-4"
          >
            <Button
              onClick={() => window.history.back()}
              className={cn(
                "w-14 h-14 rounded-none border-none flex items-center justify-center shadow-xl transition-all duration-300 p-0",
                "bg-white text-primary",
              )}
            >
              <IconArrowLeft size={34} stroke={2.5} />
            </Button>
          </motion.div>
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
