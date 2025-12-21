import { Outlet, createRootRoute, useLocation } from "@tanstack/react-router";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import "../App.css";
import { AnimatePresence, useAnimate } from "motion/react";
import { motion } from "motion/react"
import { useEffect } from "react";

const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!;
if (!CONVEX_URL) {
  console.error("missing envar VITE_CONVEX_URL");
}
const convex = new ConvexReactClient(CONVEX_URL);

function RootComponent() {
  const location = useLocation();

  return (
    <>
      <ConvexProvider client={convex}>
        <AnimatePresence mode="wait">
          <div
            key={location.pathname}
            className="fixed flex left-0 top-0 h-screen w-screen z-1000 pointer-none "
            style={{ pointerEvents: "none" }}>
            {[1, 2, 3, 4, 5].map((i, index) => (
              <>
                {/* <motion.div */}
                {/*   initial={{ opacity: 100 }} */}
                {/*   animate={{ opacity: 0, transition: { duration: 5 } }} */}
                {/*   className="absolute h-screen w-screen bg-white" /> */}
                <motion.div
                  key={index}
                  initial={{ top: 0 }}
                  animate={{
                    top: '100%',
                    transition: {
                      duration: .4, delay: .3 + index * .05
                    },
                    transitionEnd: {
                      height: 0,
                      top: 0
                    }
                  }}
                  exit={{
                    height: "100%",
                    transition: {
                      duration: .4,
                      delay: 0.05 * i
                    }
                  }}
                  className="relative bg-primary h-full w-full z-2" />
              </>
            ))}
          </div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 100, transition: { duration: 1 } }}
            exit={{ opacity: 0, transition: { duration: 0.01 } }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </ConvexProvider >
    </>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
