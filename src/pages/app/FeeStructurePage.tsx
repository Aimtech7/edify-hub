import { PageHeader } from "@/components/ui-bits";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FEE_STRUCTURE, FEE_CATEGORIES, CEFR_LEVEL_INFO, currency } from "@/lib/sample-data";
import { Pencil } from "lucide-react";
import type { CefrLevel } from "@/types";

const BAND_COLORS: Record<string, string> = {
  Beginner:     "bg-blue-50 text-blue-700 border-blue-200",
  Intermediate: "bg-amber-50 text-amber-700 border-amber-200",
  Advanced:     "bg-green-50 text-green-700 border-green-200",
};

export default function FeeStructurePage() {
  return (
    <>
      <PageHeader title="Fee Structure" description="Configurable fee schedule per CEFR language level." />

      <Card className="shadow-card mb-6">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Fee categories</h3>
          <div className="flex flex-wrap gap-2">
            {FEE_CATEGORIES.map((c) => (
              <span key={c} className="px-3 py-1.5 rounded-md border border-border bg-muted/40 text-sm">{c}</span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">CEFR level-based structure</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Level</TableHead>
                <TableHead>Band</TableHead>
                <TableHead className="text-right">Course Fee</TableHead>
                <TableHead className="text-right">Exam Reg.</TableHead>
                <TableHead className="text-right">Materials</TableHead>
                <TableHead className="text-right">Certificate</TableHead>
                <TableHead className="text-right">Lab/Tech</TableHead>
                <TableHead className="text-right font-semibold">Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FEE_STRUCTURE.map((f) => {
                const info = CEFR_LEVEL_INFO[f.level as CefrLevel];
                const total = f.tuition + f.exam + (f.materials ?? 0) + (f.certificate ?? 0) + f.activity;
                return (
                  <TableRow key={f.level}>
                    <TableCell>
                      <span className="text-lg font-display font-extrabold">{f.level}</span>
                    </TableCell>
                    <TableCell>
                      {info && <Badge className={`text-[10px] border ${BAND_COLORS[info.band]}`}>{info.band}</Badge>}
                    </TableCell>
                    <TableCell className="text-right">{currency(f.tuition)}</TableCell>
                    <TableCell className="text-right">{currency(f.exam)}</TableCell>
                    <TableCell className="text-right">{currency(f.materials ?? 0)}</TableCell>
                    <TableCell className="text-right">{currency(f.certificate ?? 0)}</TableCell>
                    <TableCell className="text-right">{currency(f.activity)}</TableCell>
                    <TableCell className="text-right font-semibold">{currency(total)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost"><Pencil className="size-4" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground mt-4">
        * All fees are per CEFR level module. Duration per level: 10–16 weeks. Fees are payable at enrollment or in two installments.
      </p>
    </>
  );
}
