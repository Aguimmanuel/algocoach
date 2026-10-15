import { lazy, Suspense } from "react";
import SessionBoundary from "./components/SessionBoundary";

const LearningApp = lazy(() => import("./LearningApp"));

export default function App() {
  return (
    <SessionBoundary>
      {(me, onSignedOut) => (
        <Suspense
          fallback={
            <main className="google-entry" role="status">
              Opening your learning space…
            </main>
          }
        >
          <LearningApp
            key={me.user.id}
            initialMe={me}
            onSignedOut={onSignedOut}
          />
        </Suspense>
      )}
    </SessionBoundary>
  );
}
