import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ExportButton({ data, filename = "export", columns, label = "Export CSV", variant = "outline", size = "sm" }) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = columns ? columns.map(c => c.label || c.key) : Object.keys(data[0]);
    const keys = columns ? columns.map(c => c.key) : Object.keys(data[0]);

    const csvRows = [
      headers.join(","),
      ...data.map(row =>
        keys.map(key => {
          const val = typeof row[key] === "object" ? JSON.stringify(row[key]) : (row[key] ?? "");
          // Escape commas and quotes in CSV
          const escaped = String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(",")
      )
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${data.length} records`);
  };

  return (
    <Button variant={variant} size={size} onClick={handleExport} className="gap-2 rounded-xl">
      <Download className="w-3.5 h-3.5" />
      {label}
    </Button>
  );
}
