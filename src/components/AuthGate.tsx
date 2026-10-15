import { useEffect, useState } from "react";
import { BookOpen, RefreshCw } from "lucide-react";
import { getAuthConfig, googleSignIn, type AuthConfig } from "../lib/api";

export function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" width="21" height="21" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.04 46.98 31.87 46.98 24.55Z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.7 23.7 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
      />
    </svg>
  );
}
const MESSAGES: Record<string, string> = {
  cancelled:
    "Google sign-in was cancelled. You can try again whenever you are ready.",
  not_configured: "Sign-in is unavailable right now. Please try again later.",
  invalid_session:
    "That sign-in link expired or did not match this browser. Please start again.",
  provider_error: "Google sign-in could not be completed. Please try again.",
  unverified_account:
    "Google could not confirm a verified email for this account. Please choose another Google account.",
  account_conflict:
    "We couldn’t open this account. Please use another Google account or contact support.",
};

export default function AuthGate({
  checking,
  error,
  onRetry,
}: {
  checking: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [configError, setConfigError] = useState(false);
  const [starting, setStarting] = useState(false);
  const load = () => {
    setConfigError(false);
    getAuthConfig()
      .then(setConfig)
      .catch(() => setConfigError(true));
  };
  useEffect(() => {
    let alive = true;
    getAuthConfig()
      .then((value) => {
        if (alive) setConfig(value);
      })
      .catch(() => {
        if (alive) setConfigError(true);
      });
    return () => {
      alive = false;
    };
  }, []);
  const callbackError =
    MESSAGES[
      new URLSearchParams(window.location.search).get("auth_error") ?? ""
    ];
  return (
    <main className="google-entry">
      <a href="/" className="google-entry-brand" aria-label="AlgoCoach home">
        <span>
          a<span className="google-brand-spark">✳</span>
        </span>
        algocoach.
      </a>
      <div className="google-entry-layout">
        <section className="google-entry-story">
          <span className="eyebrow">A LITTLE CURIOSITY GOES A LONG WAY</span>
          <h1>
            Big ideas.
            <br />
            Your next
            <br />
            <em>small step.</em>
          </h1>
          <p>
            Learn algorithms by trying them. Make a prediction, move a pointer,
            and see an idea click into place.
          </p>
          <div className="google-entry-pills">
            <span>6 courses</span>
            <span>26 lessons</span>
            <span>95 playground examples</span>
          </div>
          <div className="google-entry-art" aria-hidden="true">
            <span>2</span>
            <span>4</span>
            <span className="selected">
              6<small>you are here</small>
            </span>
            <span>8</span>
            <span>11</span>
            <i>one discovery at a time ↗</i>
          </div>
        </section>
        <section className="google-entry-card" aria-label="Google sign-in">
          <div className="google-entry-symbol">
            <BookOpen size={27} />
          </div>
          <h2>Sign in to AlgoCoach</h2>
          <p>
            One Google account. A learning space that remembers where you left
            off.
          </p>
          {checking ? (
            <div className="google-session-check" role="status">
              Checking your session…
            </div>
          ) : (
            <>
              <button
                className="google-signin-button"
                disabled={!config?.configured || starting}
                onClick={() => {
                  setStarting(true);
                  googleSignIn();
                }}
              >
                <GoogleMark />
                {starting ? "Taking you to Google…" : "Continue with Google"}
              </button>
            </>
          )}
          {!checking && config && !config.configured && (
            <div className="google-setup-notice" role="status">
              <strong>Sign-in unavailable</strong>
              <p>Please try again later.</p>
              <button
                onClick={() => {
                  load();
                  onRetry();
                }}
              >
                Try again <RefreshCw size={14} />
              </button>
            </div>
          )}
          {(error || callbackError || configError) && !checking && (
            <div className="google-entry-error" role="alert">
              {error ||
                callbackError ||
                "We could not reach the sign-in service. Check your connection and try again."}
              <button
                onClick={() => {
                  load();
                  onRetry();
                }}
              >
                Retry connection
              </button>
            </div>
          )}
        </section>
      </div>
      <footer className="google-entry-footer">
        Made for curious minds. <span>One idea at a time. ✳</span>
      </footer>
    </main>
  );
}
