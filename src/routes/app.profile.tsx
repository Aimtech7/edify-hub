import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-bits";
import { useCurrentUser } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { STUDENTS } from "@/lib/sample-data";
import { Mail, Phone, MapPin, GraduationCap, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/app/profile")({
  head: () => ({ meta: [{ title: "Profile — Horizon Academy" }] }),
  component: Profile,
});

function Profile() {
  const user = useCurrentUser();
  if (!user) return null;
  const student = STUDENTS.find((s) => s.admissionNo === user.admissionNo);
  return (
    <>
      <PageHeader title="My Profile" description="Personal information on file." action={<Button variant="outline">Request update</Button>} />
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-6 text-center">
            <div className="size-20 mx-auto rounded-full gradient-primary text-primary-foreground grid place-items-center text-2xl font-bold">
              {user.name.split(" ").map((p) => p[0]).slice(0,2).join("")}
            </div>
            <h3 className="mt-4 font-semibold">{user.name}</h3>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            <div className="mt-4 text-sm space-y-2 text-left">
              <Row icon={UserIcon} label="Username" value={user.username} />
              <Row icon={Mail} label="Email" value={user.email ?? "—"} />
              {student && <>
                <Row icon={GraduationCap} label="Class" value={student.classroom} />
                <Row icon={Phone} label="Parent phone" value={student.phone} />
              </>}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">{student ? "Student information" : "Account details"}</h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <Item label="Full name" value={user.name} />
              <Item label="Username" value={user.username} />
              <Item label="Role" value={user.role} />
              <Item label="Email" value={user.email ?? "—"} />
              {student && <>
                <Item label="Admission No" value={student.admissionNo} />
                <Item label="Class" value={student.classroom} />
                <Item label="Gender" value={student.gender === "F" ? "Female" : "Male"} />
                <Item label="Date of birth" value="14 Aug 2008" />
              </>}
            </dl>

            {student && (
              <>
                <h3 className="font-semibold mt-8 mb-4">Parent / Guardian</h3>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <Item label="Name" value={student.parent} />
                  <Item label="Relationship" value="Father" />
                  <Item label="Phone" value={student.phone} />
                  <Item label="Email" value="parent@horizon.edu" />
                </dl>
                <h3 className="font-semibold mt-8 mb-4">Contact</h3>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <Item label="Home address" value="Westlands, Nairobi" icon={<MapPin className="size-3.5" />} />
                  <Item label="Emergency contact" value={student.phone} />
                </dl>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="size-3.5" />
      <span className="text-xs">{label}:</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}
function Item({ label, value, icon }: { label: string; value: string; icon?: any }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground flex items-center gap-1.5">{icon}{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
