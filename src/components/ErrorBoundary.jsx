import { Component } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Global Error Boundary — catches unhandled runtime errors in the component tree
 * and displays a friendly fallback UI instead of a white screen.
 *
 * In production, this prevents total app crashes.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to your error tracking service (e.g. Sentry) in production
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Navigate to home if possible
    if (window.location.pathname !== "/") {
      window.location.href = "/";
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-6">
          <div className="max-w-md w-full text-center">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 mx-auto mb-6 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>

            <h1 className="text-2xl font-semibold mb-3">Something went wrong</h1>
            <p className="text-muted-foreground mb-6 leading-relaxed text-sm">
              An unexpected error occurred. This has been logged and our team will look into it.
              Please try refreshing the page.
            </p>

            {/* Error details in dev */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer mb-2">
                  Error Details (dev only)
                </summary>
                <pre className="text-xs bg-secondary p-3 rounded-xl overflow-auto max-h-40 text-destructive">
                  {this.state.error.message}
                  {"\n"}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                className="rounded-xl gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Go to Home
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="rounded-xl"
              >
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
