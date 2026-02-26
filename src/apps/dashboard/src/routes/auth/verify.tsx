import { useEffect, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useNavigate, useSearch } from "@tanstack/react-router";

export function VerifyPage() {
  const { signIn } = useAuthActions();
  const searchParams = useSearch({ from: "__root__" }) as any;
  const navigate = useNavigate();

  const [step, setStep] = useState<"loading" | "form" | "error">("loading");
  const [magicLinkId, setMagicLinkId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.magicLinkId;
    if (!id) {
      setError("No magic link ID provided");
      setStep("error");
      return;
    }
    setMagicLinkId(id);
    setStep("form");
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!magicLinkId) {
      setError("No magic link ID provided");
      return;
    }

    try {
      await signIn("phone", {
        magicLinkId,
        name,
        phone,
        password,
        flow: "signUp",
      });
      navigate({ to: "/" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
      setStep("error");
    }
  };

  if (step === "loading") {
    return <div>Loading...</div>;
  }

  if (step === "error") {
    return (
      <div className="p-6 text-center">
        <h2 className="text-red-600 text-lg mb-2">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Complete Your Profile</h1>
        <p className="text-gray-600 mb-6">
          Please provide your details to join the organization.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={4}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Join Organization
          </button>
        </form>
      </div>
    </div>
  );
}
