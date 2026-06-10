import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

export const Route = createFileRoute("/session-timeout")({
  head: () => ({ meta: [{ title: "Session Timed Out — Horizon Academy" }] }),
  component: () => (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="max-w-md text-center">
        <div className="size-14 mx-auto rounded-full bg-warning/15 text-warning grid place-items-center mb-4">
          <Clock className="size-7" />
        </div>
        <h1 className="text-2xl font-display font-bold">Session expired</h1>
        <p className="mt-2 text-muted-foreground">For your security, you've been signed out after a period of inactivity. Please sign in again to continue.</p>
        <div className="mt-6 flex gap-2 justify-center">
          <Button asChild className="gradient-primary text-primary-foreground"><Link to="/login/student">Sign in again</Link></Button>
          <Button asChild variant="outline"><Link to="/">Home</Link></Button>
        </div>
      </div>
    </div>
  ),
});
