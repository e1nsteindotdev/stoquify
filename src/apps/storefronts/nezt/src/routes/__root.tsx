import { Outlet, createRootRoute, useLocation } from "@tanstack/react-router";
import "../App.css";
import { AnimatePresence } from "motion/react";
import { motion } from "motion/react";
import { useCatalogStore } from "@/lib/catalog-store";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const location = useLocation();
  useEffect(() => {
    async function init() {
      await useCatalogStore.getState().fetchCatalog();
    }
    init();
  }, []);
  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname}>
        <div className="fixed flex left-0 top-0 h-screen w-screen z-[10000] pointer-events-none">
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0, transition: { duration: 0.1, delay: 0.6 } }}
            exit={{ opacity: 1, transition: { duration: 0.1 } }}
            className="absolute inset-0 bg-global-background -z-1"
          />
          {[1, 2, 3, 4, 5].map((_, index) => (
            <motion.div
              key={index}
              initial={{ scaleY: 1 }}
              animate={{
                scaleY: 0,
                transition: {
                  duration: 0.4,
                  delay: 0.3 + index * 0.05,
                  ease: "easeInOut",
                },
              }}
              exit={{
                scaleY: 1,
                transition: {
                  duration: 0.3,
                  delay: index * 0.05,
                  ease: "easeInOut",
                },
              }}
              style={{ transformOrigin: "top" }}
              className="relative bg-primary h-full w-full"
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.5, delay: 0.5 } }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
        >
          <Outlet />
        </motion.div>
        <Toaster />
      </motion.div>
    </AnimatePresence>
  );
}
