import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/unauthorized")({
  head: () => ({ meta: [{ title: "Unauthorized — Horizon Academy" }] }),
  component: () => (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="max-w-md text-center">
        <div className="size-14 mx-auto rounded-full bg-destructive/10 text-destructive grid place-items-center mb-4">
          <ShieldAlert className="size-7" />
        </div>
        <h1 className="text-2xl font-display font-bold">Access denied</h1>
        <p className="mt-2 text-muted-foreground">You don't have permission to view this page. If you believe this is a mistake, contact your administrator.</p>
        <div className="mt-6 flex gap-2 justify-center">
          <Button asChild variant="outline"><Link to="/app/dashboard">My dashboard</Link></Button>
          <Button asChild className="gradient-primary text-primary-foreground"><Link to="/">Home</Link></Button>
        </div>
      </div>
    </div>
  ),
});
