import { LogOut } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { googleSignIn, type AccountUser } from "../lib/api";
import { GoogleMark } from "./AuthGate";

interface Props {
  user: AccountUser | null;
  busy: boolean;
  error: string | null;
  onSignOut: () => void;
  onClearError: () => void;
}
export default function AuthPanel({
  user,
  busy,
  error,
  onSignOut,
  onClearError,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {user
            ? `Signed in${user.display_name ? ` as ${user.display_name}` : ""}`
            : "Sign in with Google"}
        </CardTitle>
        <CardDescription>
          {user
            ? user.email
            : "Use your Google account to open your learning space."}
        </CardDescription>
      </CardHeader>
      {error && (
        <CardContent>
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        </CardContent>
      )}
      <CardFooter>
        {user ? (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => {
              onClearError();
              onSignOut();
            }}
          >
            <LogOut size={16} />
            {busy ? "Signing out…" : "Sign out"}
          </Button>
        ) : (
          <Button variant="outline" onClick={googleSignIn}>
            <GoogleMark />
            Continue with Google
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
