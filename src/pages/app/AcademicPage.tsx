import { PageHeader } from "@/components/ui-bits";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CEFR_LEVELS, CEFR_LEVEL_INFO, BATCHES, SUBJECTS } from "@/lib/sample-data";
import { Plus, BookOpen } from "lucide-react";

export default function AcademicPage() {
  const allBatches = Object.entries(BATCHES).flatMap(([lvl, batches]) =>
    batches.map((b) => ({ level: lvl, name: b }))
  );

  const skillDescriptions: Record<string, string> = {
    Sprechen: "Oral expression, conversational fluency, and pronunciation.",
    Hören: "Aural comprehension, understanding native speakers, and audio exercises.",
    Lesen: "Reading comprehension of German texts, articles, and literature.",
    Schreiben: "Written composition, email drafting, and structured essays.",
    Grammatik: "Sentence structure, declension, conjugation, and syntax rules.",
    Wortschatz: "Vocabulary acquisition, idiomatic expressions, and word fields.",
  };

  return (
    <>
      <PageHeader
        title="Academic Setup"
        description="Configure language modules, CEFR levels, cohorts, and skill areas."
        action={
          <Button className="gradient-primary text-primary-foreground">
            <Plus className="size-4 mr-2" />Add new cohort/level
          </Button>
        }
      />
      <Card className="shadow-card">
        <CardContent className="p-6">
          <Tabs defaultValue="levels">
            <TabsList className="mb-4">
              <TabsTrigger value="levels">CEFR Levels</TabsTrigger>
              <TabsTrigger value="batches">Batches / Cohorts</TabsTrigger>
              <TabsTrigger value="skills">Skills Assessed</TabsTrigger>
              <TabsTrigger value="years">Academic Years</TabsTrigger>
            </TabsList>

            <TabsContent value="levels">
              <div className="text-sm text-muted-foreground mb-4">
                Six standard levels defined by the Common European Framework of Reference for Languages (CEFR).
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Level</TableHead>
                    <TableHead>Band</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Duration (Weeks)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CEFR_LEVELS.map((lvl) => {
                    const info = CEFR_LEVEL_INFO[lvl];
                    return (
                      <TableRow key={lvl}>
                        <TableCell className="font-bold text-lg">{lvl}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            info.band === "Beginner" ? "border-blue-200 bg-blue-50 text-blue-700" :
                            info.band === "Intermediate" ? "border-amber-200 bg-amber-50 text-amber-700" :
                            "border-green-200 bg-green-50 text-green-700"
                          }>
                            {info.band}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{info.description}</TableCell>
                        <TableCell className="text-right font-medium">{info.durationWeeks} weeks</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="batches">
              <div className="text-sm text-muted-foreground mb-4">
                Active learning groups assigned to specific CEFR levels.
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cohort / Batch Code</TableHead>
                    <TableHead>CEFR Level</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allBatches.map((b) => (
                    <TableRow key={b.name}>
                      <TableCell className="font-medium">{b.name}</TableCell>
                      <TableCell><Badge variant="outline">Level {b.level}</Badge></TableCell>
                      <TableCell><Badge className="bg-success/15 text-success border-success/20">Active</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="skills">
              <div className="text-sm text-muted-foreground mb-4">
                Core German language components evaluated during module examinations.
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Skill (Fertigkeit)</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SUBJECTS.map((s) => (
                    <TableRow key={s}>
                      <TableCell className="font-semibold flex items-center gap-2">
                        <BookOpen className="size-4 text-primary" />
                        {s}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{skillDescriptions[s] || "German core skill area."}</TableCell>
                      <TableCell><Badge className="bg-success/15 text-success border-success/20">Core</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="years">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { y: "2025", s: "Jan 6, 2025", e: "Nov 21, 2025", st: "Active" },
                    { y: "2024", s: "Jan 8, 2024", e: "Nov 22, 2024", st: "Closed" }
                  ].map((r) => (
                    <TableRow key={r.y}>
                      <TableCell className="font-medium">{r.y}</TableCell>
                      <TableCell>{r.s}</TableCell>
                      <TableCell>{r.e}</TableCell>
                      <TableCell>
                        {r.st === "Active" ? (
                          <Badge className="bg-success/15 text-success border-success/20">Active</Badge>
                        ) : (
                          <Badge variant="outline">{r.st}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
