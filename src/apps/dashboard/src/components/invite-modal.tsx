import { useState } from "react";
import { api } from "api/convex";
import QRCode from "react-qr-code";
import { useAppStore } from "@/lib/store";
import { convex } from "@/lib/convex-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Id } from "api/data-model";

export function InviteStaffModal() {
  const base_url = import.meta.env.VITE_BASE_URL?.replace(/\/$/, "");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const user = useAppStore((state) => state.user);
  const invite = useMutation({
    mutationFn: (payload: {
      email?: string;
      role: "admin" | "staff";
      permissions: { resource: string; action: "*" }[];
      organizationId: string;
    }) =>
      convex.mutation(api.magicLinks.insert, {
        ...payload,
        organizationId: payload.organizationId as Id<"organizations">,
      }),
  });
  const { data: availablePermissions = [] } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => convex.query(api.permissions.list),
  });

  const handleGenerateLink = async () => {
    if (!user?.organization?._id) return;

    const permissions = selectedPermissions.map((perm) => ({
      resource: perm,
      action: "*" as const,
    }));

    const result = await invite.mutateAsync({
      email,
      role,
      permissions,
      organizationId: user.organization._id,
    });

    // const link = `${base_url}/magic-link?magicLinkId=${result._id}`;
    const baseUrl = (
      import.meta.env.VITE_BASE_URL || window.location.origin
    ).replace(/\/$/, "");
    const link = `${baseUrl}/magic-link?magicLinkId=${result._id}`;
    setGeneratedLink(link);
  };

  const togglePermission = (perm: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  if (generatedLink) {
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-semibold mb-4">Scan to Join</h3>
        <div className="bg-white p-4 inline-block rounded-lg">
          <QRCode value={generatedLink} size={200} />
        </div>
        <p className="text-sm text-gray-500 mt-4">
          This QR code expires in 7 days
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Or share this link: {generatedLink.substring(0, 50)}...
        </p>
        <button
          onClick={() => setGeneratedLink(null)}
          className="mt-4 text-sm underline"
        >
          Generate New
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="staff@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "admin" | "staff")}
          className="w-full border rounded px-3 py-2"
        >
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Permissions</label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {availablePermissions?.map((perm: any) => (
            <label key={perm.key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedPermissions.includes(perm.key)}
                onChange={() => togglePermission(perm.key)}
                disabled={role === "admin"} // Admin gets all permissions
              />
              <span>{perm.key}</span>
              {perm.description && (
                <span className="text-gray-500 text-sm">
                  - {perm.description}
                </span>
              )}
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={handleGenerateLink}
        disabled={
          !email || (role === "staff" && selectedPermissions.length === 0)
        }
        className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
      >
        Generate Invite
      </button>
    </div>
  );
}
