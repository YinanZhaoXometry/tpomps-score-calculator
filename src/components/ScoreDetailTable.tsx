import { Award } from "lucide-react";
import { cn } from "../lib/utils";

export interface SubjectResult {
  id: string;
  name: string;
  raw: number;
  weight: number;
  weighted: number;
  maxWeighted: number;
}

interface ScoreDetailTableProps {
  results: SubjectResult[];
  /** 內嵌於其他卡片內時不帶外框 */
  embedded?: boolean;
}

export function ScoreDetailTable({ results, embedded }: ScoreDetailTableProps) {
  return (
    <div
      className={cn(
        "overflow-hidden",
        !embedded && "bg-card rounded-2xl border border-border"
      )}
    >
      <div
        className={cn(
          "px-6 py-4 flex items-center gap-2",
          !embedded && "border-b border-border"
        )}
      >
        <Award className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">各科明細</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-6 py-3 font-medium text-muted-foreground">
                科目
              </th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                原始分
              </th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                權重
              </th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                加權分
              </th>
              <th className="text-right px-6 py-3 font-medium text-muted-foreground">
                滿分
              </th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr
                key={r.id}
                className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
              >
                <td className="px-6 py-3 font-medium text-foreground">
                  {r.name}
                </td>
                <td className="text-right px-4 py-3 font-mono text-foreground">
                  {r.raw}
                </td>
                <td className="text-right px-4 py-3 font-mono text-muted-foreground">
                  x{r.weight}
                </td>
                <td className="text-right px-4 py-3 font-mono font-medium text-foreground">
                  {r.weighted}
                </td>
                <td className="text-right px-6 py-3 font-mono text-muted-foreground">
                  {r.maxWeighted}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
