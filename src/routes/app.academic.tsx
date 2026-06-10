import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-bits";
import { RoleGate } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CLASSES, SUBJECTS } from "@/lib/sample-data";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/app/academic")({
  head: () => ({ meta: [{ title: "Academic Setup — Horizon Academy" }] }),
  component: () => <RoleGate allowed={["admin"]}><Academic /></RoleGate>,
});

function Academic() {
  return (
    <>
      <PageHeader title="Academic Setup" description="Years, terms, classes and subjects." action={<Button className="gradient-primary text-primary-foreground"><Plus className="size-4 mr-2" />Add new</Button>} />
      <Card className="shadow-card">
        <CardContent className="p-6">
          <Tabs defaultValue="years">
            <TabsList>
              <TabsTrigger value="years">Years</TabsTrigger>
              <TabsTrigger value="terms">Terms</TabsTrigger>
              <TabsTrigger value="classes">Classes</TabsTrigger>
              <TabsTrigger value="subjects">Subjects</TabsTrigger>
            </TabsList>

            <TabsContent value="years" className="pt-4">
              <Table><TableHeader><TableRow><TableHead>Year</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {[{y:"2025",s:"Jan 6, 2025",e:"Nov 21, 2025",st:"Active"},{y:"2024",s:"Jan 8, 2024",e:"Nov 22, 2024",st:"Closed"}].map((r) => (
                    <TableRow key={r.y}><TableCell className="font-medium">{r.y}</TableCell><TableCell>{r.s}</TableCell><TableCell>{r.e}</TableCell>
                      <TableCell>{r.st === "Active" ? <Badge className="bg-success/15 text-success border-success/20">Active</Badge> : <Badge variant="outline">{r.st}</Badge>}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="terms" className="pt-4">
              <Table><TableHeader><TableRow><TableHead>Term</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead></TableRow></TableHeader>
                <TableBody>
                  {[{n:"Term 1",s:"Jan 6",e:"Apr 4"},{n:"Term 2",s:"May 5",e:"Aug 8"},{n:"Term 3",s:"Sep 1",e:"Nov 21"}].map((r) => (
                    <TableRow key={r.n}><TableCell className="font-medium">{r.n}</TableCell><TableCell>{r.s}</TableCell><TableCell>{r.e}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="classes" className="pt-4">
              <Table><TableHeader><TableRow><TableHead>Class</TableHead><TableHead>Stream</TableHead><TableHead className="text-right">Capacity</TableHead></TableRow></TableHeader>
                <TableBody>
                  {CLASSES.map((c) => <TableRow key={c}><TableCell className="font-medium">{c}</TableCell><TableCell>{c.split(" ")[2]}</TableCell><TableCell className="text-right">40</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="subjects" className="pt-4">
              <Table><TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Department</TableHead><TableHead>Compulsory</TableHead></TableRow></TableHeader>
                <TableBody>
                  {SUBJECTS.map((s) => <TableRow key={s}><TableCell className="font-medium">{s}</TableCell><TableCell>{["Mathematics","Physics","Chemistry","Biology"].includes(s) ? "Sciences" : "Humanities"}</TableCell><TableCell>{["Mathematics","English","Kiswahili"].includes(s) ? <Badge>Yes</Badge> : <Badge variant="outline">Optional</Badge>}</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
