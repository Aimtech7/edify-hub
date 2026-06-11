import { PageHeader } from "@/components/ui-bits";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FEE_STRUCTURE, FEE_CATEGORIES, currency } from "@/lib/sample-data";
import { Pencil } from "lucide-react";

export default function FeeStructurePage() {
  return (
    <>
      <PageHeader title="Fee Structure" description="Class-based fee structures and categories." />

      <Card className="shadow-card mb-6">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Fee categories</h3>
          <div className="flex flex-wrap gap-2">
            {FEE_CATEGORIES.map((c) => <span key={c} className="px-3 py-1.5 rounded-md border border-border bg-muted/40 text-sm">{c}</span>)}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Class-based structure</h3>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Class</TableHead><TableHead className="text-right">Tuition</TableHead><TableHead className="text-right">Exam</TableHead>
              <TableHead className="text-right">Library</TableHead><TableHead className="text-right">Activity</TableHead><TableHead className="text-right">Boarding</TableHead>
              <TableHead className="text-right">Total</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {FEE_STRUCTURE.map((f) => {
                const total = f.tuition + f.exam + f.library + f.activity + f.boarding;
                return (
                  <TableRow key={f.classroom}>
                    <TableCell className="font-medium">{f.classroom}</TableCell>
                    <TableCell className="text-right">{currency(f.tuition)}</TableCell>
                    <TableCell className="text-right">{currency(f.exam)}</TableCell>
                    <TableCell className="text-right">{currency(f.library)}</TableCell>
                    <TableCell className="text-right">{currency(f.activity)}</TableCell>
                    <TableCell className="text-right">{currency(f.boarding)}</TableCell>
                    <TableCell className="text-right font-semibold">{currency(total)}</TableCell>
                    <TableCell className="text-right"><Button size="sm" variant="ghost"><Pencil className="size-4" /></Button></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
