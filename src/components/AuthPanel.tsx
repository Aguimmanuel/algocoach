import { useState } from "react";
import { Button, Card, Input, Label } from "./ui";
import type { AccountUser } from "../lib/api";

interface Props {
  user: AccountUser | null;
  busy: boolean;
  error: string | null;
  onSignUp: (email: string, password: string, name: string) => Promise<boolean>;
  onSignIn: (email: string, password: string) => Promise<boolean>;
  onSignOut: () => void;
  onClearError: () => void;
}

/**
 * Sign in or create an account.
 *
 * The copy leads with what you get rather than what you must do: an account is
 * for carrying progress between devices, and the app works without one. That
 * framing is the difference between a gate and an offer.
 */
export default function AuthPanel({
  user,
  busy,
  error,
  onSignUp,
  onSignIn,
  onSignOut,
  onClearError,
}: Props) {
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  if (user) {
    return (
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-900">
              Signed in{user.display_name ? ` as ${user.display_name}` : ""}
            </p>
            <p className="text-sm text-slate-500">
              Progress on this account syncs to any device you sign in on.
            </p>
          </div>
          <Button variant="secondary" onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </Card>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    onClearError();
    const ok =
      mode === "signup" ? await onSignUp(email, password, name) : await onSignIn(email, password);
    if (ok) {
      setEmail("");
      setPassword("");
      setName("");
    }
  };

  return (
    <Card>
      <h3 className="text-lg font-bold text-slate-900">
        {mode === "signup" ? "Keep your progress" : "Welcome back"}
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        {mode === "signup"
          ? "Your work is saved on this device already. An account means it follows you to the next one — and lets us see where people get stuck so we can improve this."
          : "Sign in to carry on where you left off."}
      </p>

      <form onSubmit={submit} className="mt-5 space-y-4">
        {mode === "signup" && (
          <div>
            <Label htmlFor="name">Your name (optional)</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Gamp"
              autoComplete="name"
              className="mt-1.5"
            />
          </div>
        )}

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="mt-1.5"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-100" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={busy}>
            {mode === "signup" ? "Create account" : "Sign in"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setMode(mode === "signup" ? "signin" : "signup");
              onClearError();
            }}
          >
            {mode === "signup" ? "I already have one" : "Create an account instead"}
          </Button>
        </div>
      </form>

      <p className="mt-4 text-xs text-slate-400">
        You can keep learning without an account — nothing here is required.
      </p>
    </Card>
  );
}
