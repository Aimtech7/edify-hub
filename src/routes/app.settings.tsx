import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-bits";
import { RoleGate } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { INSTITUTION } from "@/lib/sample-data";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "System Settings — Horizon Academy" }] }),
  component: () => <RoleGate allowed={["admin"]}><Settings /></RoleGate>,
});

function Settings() {
  return (
    <>
      <PageHeader title="System Settings" description="General configuration and operational defaults." action={<Button className="gradient-primary text-primary-foreground" onClick={() => toast.success("Settings saved")}>Save changes</Button>} />
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="shadow-card"><CardContent className="p-6">
          <h3 className="font-semibold mb-4">Institution</h3>
          <div className="space-y-3">
            <Field label="Name" defaultValue={INSTITUTION.name} />
            <Field label="Motto" defaultValue={INSTITUTION.motto} />
            <Field label="Address" defaultValue={INSTITUTION.address} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone" defaultValue={INSTITUTION.phone} />
              <Field label="Email" defaultValue={INSTITUTION.email} />
            </div>
          </CardContent></Card>

        <Card className="shadow-card"><CardContent className="p-6">
          <h3 className="font-semibold mb-4">Finance</h3>
          <div className="space-y-3">
            <Field label="Default currency" defaultValue="KES" />
            <Field label="Receipt prefix" defaultValue="RCT-" />
            <Field label="M-Pesa Paybill" defaultValue="247247" />
            <Field label="Bank account" defaultValue="Equity · 1100 23456" />
          </div>
        </CardContent></Card>

        <Card className="shadow-card"><CardContent className="p-6">
          <h3 className="font-semibold mb-4">Security</h3>
          <div className="space-y-4">
            <Toggle label="Require 2FA for administrators" defaultChecked />
            <Toggle label="Auto sign-out after 15 min" defaultChecked />
            <Toggle label="Allow password reset via email" defaultChecked />
            <Toggle label="Lock account after 5 failed attempts" defaultChecked />
          </div>
        </CardContent></Card>

        <Card className="shadow-card"><CardContent className="p-6">
          <h3 className="font-semibold mb-4">Notifications</h3>
          <div className="space-y-4">
            <Toggle label="Email parents on payment received" defaultChecked />
            <Toggle label="SMS reminders for outstanding balances" defaultChecked />
            <Toggle label="Push alerts for marks publication" />
            <Toggle label="Daily finance summary to accountant" defaultChecked />
          </div>
        </CardContent></Card>
      </div>
    </>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input defaultValue={defaultValue} />
    </div>
  );
}
function Toggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
