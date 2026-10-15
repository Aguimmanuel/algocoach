import { Component, type ReactNode } from "react";
export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main
          className="empty-state"
          style={{ maxWidth: 600, margin: "12vh auto" }}
        >
          <h1>Let’s take a fresh start.</h1>
          <p>Something unexpected happened. Please reload to continue.</p>
          <button
            className="studio-button"
            onClick={() => window.location.reload()}
          >
            Reload the classroom
          </button>
        </main>
      );
    return this.props.children;
  }
}
