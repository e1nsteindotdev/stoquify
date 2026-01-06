import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IconDatabase,
  IconFolder,
  IconKey,
  IconCloud,
} from "@tabler/icons-react";
import { formatBytes } from "@/lib/storage-utils";

interface StorageCardProps {
  title: string;
  size?: number;
  count?: number;
  icon: "opfs" | "indexeddb" | "localstorage" | "cache";
  supported: boolean;
}

export function StorageCard({
  title,
  size,
  count,
  icon,
  supported,
}: StorageCardProps) {
  const getIcon = () => {
    switch (icon) {
      case "opfs":
        return <IconFolder className="h-5 w-5 text-muted-foreground" />;
      case "indexeddb":
        return <IconDatabase className="h-5 w-5 text-muted-foreground" />;
      case "localstorage":
        return <IconKey className="h-5 w-5 text-muted-foreground" />;
      case "cache":
        return <IconCloud className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getSubtitle = () => {
    if (!supported) return "Not supported in this browser";
    if (icon === "indexeddb" && count !== undefined) {
      return `${count} database${count !== 1 ? "s" : ""}`;
    }
    if (icon === "cache" && count !== undefined) {
      return `${count} cache${count !== 1 ? "s" : ""}`;
    }
    if (size !== undefined && count !== undefined) {
      return `${formatBytes(size)} • ${count} file${count !== 1 ? "s" : ""}`;
    }
    if (size !== undefined) {
      return formatBytes(size);
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        {getIcon()}
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {supported ? (size !== undefined ? formatBytes(size) : "—") : "—"}
        </div>
        <p className="text-sm text-muted-foreground">
          {getSubtitle() || (supported ? "Empty" : "Not available")}
        </p>
      </CardContent>
    </Card>
  );
}
