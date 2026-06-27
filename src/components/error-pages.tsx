import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert, FileQuestion, ServerCrash, WifiOff, RefreshCw, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  onRetry?: () => void;
  message?: string;
}

export function Error403({ onRetry, message }: ErrorProps) {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center space-y-6 bg-card p-8 rounded-2xl border border-border shadow-card">
        <div className="size-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="size-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">403 Forbidden</h1>
          <h2 className="text-lg font-semibold text-foreground">Access Restricted</h2>
          <p className="text-sm text-muted-foreground">
            {message || "You do not have the required security permissions or role to access this resource."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-4 mr-2" /> Go Back
          </Button>
          <Button asChild className="gradient-primary text-primary-foreground">
            <Link to="/app/dashboard"><Home className="size-4 mr-2" /> Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Error404({ message }: ErrorProps) {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center space-y-6 bg-card p-8 rounded-2xl border border-border shadow-card">
        <div className="size-16 bg-warning/10 text-warning rounded-full flex items-center justify-center mx-auto">
          <FileQuestion className="size-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">404</h1>
          <h2 className="text-lg font-semibold text-foreground">Page Not Found</h2>
          <p className="text-sm text-muted-foreground">
            {message || "The page or module you are attempting to view does not exist or has been relocated."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-4 mr-2" /> Go Back
          </Button>
          <Button asChild className="gradient-primary text-primary-foreground">
            <Link to="/"><Home className="size-4 mr-2" /> Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Error500({ onRetry, message }: ErrorProps) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center space-y-6 bg-card p-8 rounded-2xl border border-border shadow-card">
        <div className="size-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
          <ServerCrash className="size-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">500</h1>
          <h2 className="text-lg font-semibold text-foreground">System Internal Error</h2>
          <p className="text-sm text-muted-foreground">
            {message || "We encountered an unexpected error while processing your request. Our technical staff has been notified."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          {onRetry && (
            <Button onClick={onRetry} variant="default" className="gradient-primary text-primary-foreground">
              <RefreshCw className="size-4 mr-2" /> Retry Request
            </Button>
          )}
          <Button asChild variant="outline">
            <Link to="/app/dashboard"><Home className="size-4 mr-2" /> Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ErrorOffline({ onRetry }: ErrorProps) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center space-y-6 bg-card p-8 rounded-2xl border border-border shadow-card">
        <div className="size-16 bg-muted text-muted-foreground rounded-full flex items-center justify-center mx-auto animate-pulse">
          <WifiOff className="size-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Offline Mode</h1>
          <p className="text-sm text-muted-foreground">
            Your network connection appears to be offline. Please verify your internet settings to continue synchronizing real-time ERP data.
          </p>
        </div>
        <div className="pt-2">
          <Button onClick={onRetry || (() => window.location.reload())} className="w-full gradient-primary text-primary-foreground">
            <RefreshCw className="size-4 mr-2" /> Reconnect
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ErrorNetwork({ onRetry, message }: ErrorProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4 bg-card p-6 rounded-xl border border-border">
        <div className="size-12 bg-warning/10 text-warning rounded-full flex items-center justify-center mx-auto">
          <RefreshCw className="size-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold">Network Timeout or Failure</h3>
          <p className="text-xs text-muted-foreground">
            {message || "Failed to fetch data from Horizon servers. Check your connection or retry."}
          </p>
        </div>
        {onRetry && (
          <Button size="sm" onClick={onRetry} className="gradient-primary text-primary-foreground">
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
