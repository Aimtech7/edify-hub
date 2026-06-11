import { useMemo, useState, type ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { exportToCsv } from "@/utils/format";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (row: T) => ReactNode;
  /** Value accessor used for sorting and CSV export. Defaults to row[key]. */
  accessor?: (row: T) => string | number;
}

export interface Filter {
  key: string;
  label: string;
  options: { label: string; value: string }[];
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchKeys?: (keyof T | string)[];
  searchPlaceholder?: string;
  filters?: Filter[];
  pageSize?: number;
  exportFilename?: string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  searchKeys,
  searchPlaceholder = "Search…",
  filters = [],
  pageSize = 8,
  exportFilename,
  emptyMessage = "No records found.",
  onRowClick,
  loading,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const processed = useMemo(() => {
    let rows = [...data];

    if (search && searchKeys?.length) {
      const q = search.toLowerCase();
      rows = rows.filter((row) =>
        searchKeys.some((k) =>
          String(row[k as keyof T] ?? "")
            .toLowerCase()
            .includes(q)
        )
      );
    }

    for (const f of filters) {
      const val = filterValues[f.key];
      if (val && val !== "__all__") {
        rows = rows.filter((row) => String(row[f.key as keyof T]) === val);
      }
    }

    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      rows.sort((a, b) => {
        const av = col?.accessor ? col.accessor(a) : (a[sortKey as keyof T] as unknown as string | number);
        const bv = col?.accessor ? col.accessor(b) : (b[sortKey as keyof T] as unknown as string | number);
        if (av === bv) return 0;
        const res = av > bv ? 1 : -1;
        return sortDir === "asc" ? res : -res;
      });
    }

    return rows;
  }, [data, search, searchKeys, filters, filterValues, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  const current = Math.min(page, totalPages);
  const paged = processed.slice((current - 1) * pageSize, current * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleExport = () => {
    const rows = processed.map((row) => {
      const out: Record<string, unknown> = {};
      for (const c of columns) {
        out[c.header] = c.accessor ? c.accessor(row) : row[c.key as keyof T];
      }
      return out;
    });
    exportToCsv(rows, exportFilename || "export");
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {searchKeys?.length ? (
            <div className="relative w-full sm:w-64">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={searchPlaceholder}
                className="pl-9 h-9"
              />
            </div>
          ) : null}
          {filters.map((f) => (
            <Select
              key={f.key}
              value={filterValues[f.key] ?? "__all__"}
              onValueChange={(v) => {
                setFilterValues((prev) => ({ ...prev, [f.key]: v }));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-auto min-w-36">
                <SelectValue placeholder={f.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All {f.label}</SelectItem>
                {f.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
        {exportFilename && (
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="size-4" /> Export
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {columns.map((c) => (
                  <TableHead key={c.key} className={c.className}>
                    {c.sortable ? (
                      <button
                        onClick={() => toggleSort(c.key)}
                        className="inline-flex items-center gap-1.5 font-medium hover:text-foreground"
                      >
                        {c.header}
                        {sortKey === c.key ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="size-3.5" />
                          ) : (
                            <ArrowDown className="size-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="size-3.5 opacity-40" />
                        )}
                      </button>
                    ) : (
                      c.header
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((c) => (
                      <TableCell key={c.key}>
                        <div className="h-4 w-full max-w-32 rounded bg-muted animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paged.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((row, i) => (
                  <TableRow
                    key={i}
                    onClick={() => onRowClick?.(row)}
                    className={cn(onRowClick && "cursor-pointer")}
                  >
                    {columns.map((c) => (
                      <TableCell key={c.key} className={c.className}>
                        {c.render ? c.render(row) : String(row[c.key as keyof T] ?? "")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm">
        <div className="text-muted-foreground">
          Showing {paged.length ? (current - 1) * pageSize + 1 : 0}–
          {(current - 1) * pageSize + paged.length} of {processed.length}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={current <= 1}
            className="gap-1"
          >
            <ChevronLeft className="size-4" /> Prev
          </Button>
          <span className="text-muted-foreground px-2">
            Page {current} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={current >= totalPages}
            className="gap-1"
          >
            Next <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
