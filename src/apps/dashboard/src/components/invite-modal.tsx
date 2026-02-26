import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "api/convex";
import QRCode from "react-qr-code";
import { useAppStore } from "@/lib/store";

export function InviteStaffModal() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const invite = useMutation(api.magicLinks.invite);
  const availablePermissions = useQuery(api.permissions?.list || null);
  const currentStore = useAppStore(state => state.selectedStore)

  const handleGenerateLink = async () => {
    if (!currentStore?._id) {
      throw new Error("No store selected");
    }

    const permissions = selectedPermissions.map((perm) => ({
      storeId: currentStore._id as any,
      resource: perm,
      action: "*" as const,
    }));

    const result = await invite({
      email,
      role,
      permissions,
      storeId: currentStore._id as any,
    });

    const link = `${window.location.origin}/auth/verify?magicLinkId=${result._id}`;
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
