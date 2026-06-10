import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/ui-bits";
import { RoleGate } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { USERS } from "@/lib/sample-data";
import { Plus, Search, KeyRound, Pencil, Ban } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/users")({
  head: () => ({ meta: [{ title: "User Management — Horizon Academy" }] }),
  component: () => <RoleGate allowed={["admin"]}><UsersPage /></RoleGate>,
});

function UsersPage() {
  const [q, setQ] = useState("");
  const list = USERS.filter((u) => !q || u.name.toLowerCase().includes(q.toLowerCase()) || u.username.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader title="User Management" description="Create users, assign roles and manage access." action={<NewUserDialog />} />
      <Card className="shadow-card mb-4">
        <CardContent className="p-4 relative">
          <Search className="size-4 absolute left-7 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users…" className="pl-9" />
        </CardContent>
      </Card>
      <Card className="shadow-card">
        <CardContent className="p-6">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Username</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Last login</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {list.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="font-mono text-xs">{u.username}</TableCell>
                  <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                  <TableCell>{u.status === "Active"
                    ? <Badge className="bg-success/15 text-success border-success/20">Active</Badge>
                    : <Badge className="bg-destructive/10 text-destructive border-destructive/20">Disabled</Badge>}</TableCell>
                  <TableCell className="text-muted-foreground">{u.lastLogin}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => toast.success(`Password reset for ${u.username}`)}><KeyRound className="size-4" /></Button>
                    <Button size="sm" variant="ghost"><Pencil className="size-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => toast.success(`${u.username} disabled`)}><Ban className="size-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

function NewUserDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="gradient-primary text-primary-foreground"><Plus className="size-4 mr-2" />New user</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create new user</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); toast.success("User created. Invitation email sent."); setOpen(false); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Full name</Label><Input /></div>
            <div className="space-y-1.5"><Label>Username</Label><Input /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" /></div>
            <div className="space-y-1.5"><Label>Role</Label>
              <Select defaultValue="Teacher"><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Student","Teacher","Accountant","Administrator"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button type="submit" className="gradient-primary text-primary-foreground">Create user</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
