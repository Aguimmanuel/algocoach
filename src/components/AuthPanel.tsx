import { useState } from "react";
import { CircleAlert, LogOut } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Field, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
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
        <CardHeader>
          <CardTitle className="text-base">
            Signed in{user.display_name ? ` as ${user.display_name}` : ""}
          </CardTitle>
          <CardDescription>Progress on this account syncs to any device you sign in on.</CardDescription>
          <LogOut className="size-4 text-muted-foreground" aria-hidden />
        </CardHeader>
        <CardFooter>
          <Button variant="outline" onClick={onSignOut}>
            Sign out
          </Button>
        </CardFooter>
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
      <CardHeader>
        <CardTitle className="text-base">
          {mode === "signup" ? "Keep your progress" : "Welcome back"}
        </CardTitle>
        <CardDescription>
          {mode === "signup"
            ? "Your work is saved on this device already. An account means it follows you to the next one — and lets us see where people get stuck so we can improve this."
            : "Sign in to carry on where you left off."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <Field>
              <FieldLabel htmlFor="name">Your name (optional)</FieldLabel>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Gamp"
                autoComplete="name"
              />
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </Field>

          {error && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={busy}>
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
      </CardContent>

      <CardFooter>
        <p className="text-xs text-muted-foreground">
          You can keep learning without an account — nothing here is required.
        </p>
      </CardFooter>
    </Card>
  );
}
