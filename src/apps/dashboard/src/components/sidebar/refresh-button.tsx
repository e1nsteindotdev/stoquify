import * as React from "react";
import { motion } from "motion/react";
import { IconRefresh } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function RefreshButton() {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Re-trigger the whole page refresh
    window.location.reload();
  };

  return (
    <div className="md:hidden fixed bottom-6 left-6 z-50 flex flex-col items-start">
      <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}>
        <Button
          onClick={handleRefresh}
          className={cn(
            "w-14 h-14 rounded-none border-none flex items-center justify-center shadow-xl transition-all duration-300 p-0",
            "bg-white text-primary",
          )}
          disabled={isRefreshing}
        >
          <motion.div
            animate={isRefreshing ? { rotate: 360 } : {}}
            transition={
              isRefreshing
                ? { repeat: Infinity, duration: 1, ease: "linear" }
                : {}
            }
          >
            <IconRefresh size={34} stroke={2.5} />
          </motion.div>
        </Button>
      </motion.div>
    </div>
  );
}
