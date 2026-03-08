import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

const Toaster = ({ ...props }: ToasterProps) => {
  const isMobile = useIsMobile();

  return (
    <Sonner
      theme="light"
      className="toaster group"
      position={isMobile ? "top-center" : "bottom-right"}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-primary group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-none",
          description: "group-[.toast]:text-primary",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          icon: "group-[.toast]:text-primary",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
