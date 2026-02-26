import { useState, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence, HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

type Stage = "neutral" | "loading" | "done";

type AnimationContent = string | ReactNode;

type AnimationComponents = {
  loading: AnimationContent;
  done: AnimationContent;
};

function resolveContent(content: AnimationContent): ReactNode {
  return typeof content === "string" ? <p>{content}</p> : content;
}

export function AnimatedButton({
  className,
  children,
  loading,
  animationComponents,
  disabled,
  ...props
}: HTMLMotionProps<"button"> & {
  animationComponents: AnimationComponents;
  loading: boolean;
  children: string;
  disabled?: boolean;
}) {
  const contents = { ...animationComponents, neutral: children };
  const [stage, setStage] = useState<Stage>(loading ? "loading" : "neutral");

  useEffect(() => {
    if (loading) {
      setStage("loading");
    } else if (stage === "loading") {
      setStage("done");
      const timer = setTimeout(() => {
        setStage("neutral");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const isLoading = stage === "loading";

  return (
    <motion.button
      className={cn(className, "overflow-clip")}
      disabled={disabled || isLoading}
      animate={{ opacity: isLoading ? 0.7 : 1 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          className="flex items-center justify-center"
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {resolveContent(contents[stage])}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
