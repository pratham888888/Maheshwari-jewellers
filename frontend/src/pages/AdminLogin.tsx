import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiPost, ApiError } from "@/lib/api";
import type { AdminUser } from "@/lib/types";
import { useSeo } from "@/lib/site";

export default function AdminLogin() {
  useSeo("Admin Login | Maheshwari Jewellers", "Secure admin login for Maheshwari Jewellers catalogue management.");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const login = useMutation({
    mutationFn: () =>
      apiPost<AdminUser>("/auth/login", {
        username: username.trim(),
        password: password.trim(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      navigate("/admin");
    },
    onError: (e) => {
      const detail = e instanceof ApiError ? (e.body as { detail?: string })?.detail : null;
      setError(detail || "Login failed. Please check your username and password.");
    },
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] grid place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-[#8A5A00] hover:underline" data-testid="admin-login-home-link">
          <ArrowLeft className="h-4 w-4" /> Back to website
        </Link>

        <div className="mt-4 bg-white rounded-xl border border-[#E8E2D8] shadow-xs p-7">
          <div className="h-11 w-11 rounded-full bg-[#FBF5E8] grid place-items-center">
            <Lock className="h-5 w-5 text-[#996515]" aria-hidden />
          </div>
          <h1 className="mt-4 font-heading text-2xl text-stone-900">Admin Login</h1>
          <p className="mt-1 text-sm text-stone-500">Maheshwari Jewellers catalogue management</p>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setError("");
              login.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                data-testid="admin-username-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                data-testid="admin-password-input"
              />
            </div>

            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2" data-testid="admin-login-error">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-[#996515] hover:bg-[#7A4D05]"
              disabled={login.isPending}
              data-testid="admin-login-submit"
            >
              {login.isPending ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
