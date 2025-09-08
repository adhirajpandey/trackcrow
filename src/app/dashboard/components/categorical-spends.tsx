import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { numberToINR } from "@/common/utils";
import { useRouter } from "next/navigation";

export interface CategoricalSpend {
  category: string;
  total: number;
  count: number;
}

function getCategoryColor(i: number) {
  // A set of distinct, vibrant colors (hex for SVG + Tailwind bg class for progress)
  const palette: { hex: string; bgClass: string }[] = [
    { hex: "#10b981", bgClass: "bg-emerald-500" }, // green
    { hex: "#3b82f6", bgClass: "bg-blue-500" }, // blue
    { hex: "#5b21b6", bgClass: "bg-indigo-600" }, // deep indigo
    { hex: "#ec4899", bgClass: "bg-pink-500" }, // pink
  ];

  return palette[i % palette.length];
}

export function CategoricalSpends({
  categoricalSpends,
  selectedTimeframe,
}: {
  categoricalSpends: CategoricalSpend[];
  selectedTimeframe: string;
}) {
  const router = useRouter();
  if (categoricalSpends.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="px-2 pt-4 sm:px-4">
          <CardTitle className="text-base font-semibold">
            Categorical Expenses
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 px-2 pb-4 sm:px-4 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">No data available</div>
        </CardContent>
      </Card>
    );
  }

  const total = categoricalSpends.reduce((s, c) => s + c.total, 0);

  // Prepare segments with percent and color
  const segments = categoricalSpends.map((s, i) => {
    const color = getCategoryColor(i);
    return {
      ...s,
      percent: total > 0 ? (s.total / total) * 100 : 0,
      colorHex: color.hex,
      colorClass: color.bgClass,
    };
  });

  // SVG donut parameters
  const size = 180;
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  let offsetAccumulator = 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="px-2 pt-4 sm:px-4">
        <CardTitle className="text-base font-semibold">
          Categorical Expenses
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border px-2 pb-4 sm:px-4">
        <div className="flex flex-col xl:flex-row gap-4 items-center">
          {/* Donut chart */}
          <div className="flex-shrink-0 w-full max-w-[180px] flex items-center justify-center mb-4 xl:mb-0 px-2">
            <svg
              className="w-full h-auto max-w-[180px]"
              viewBox={`0 0 ${size} ${size}`}
              preserveAspectRatio="xMidYMid meet"
            >
              <g transform={`translate(${size / 2}, ${size / 2})`}>
                {/* background ring */}
                <circle
                  r={radius}
                  fill="transparent"
                  stroke="rgba(148,163,184,0.12)"
                  strokeWidth={stroke}
                />

                {/* segments */}
                {segments.map((seg) => {
                  const dash = (seg.percent / 100) * circumference;
                  const dashArray = `${dash} ${circumference - dash}`;
                  const dashOffset = -offsetAccumulator;
                  offsetAccumulator += dash;
                  return (
                    <circle
                      key={seg.category}
                      r={radius}
                      fill="transparent"
                      stroke={seg.colorHex}
                      strokeWidth={stroke}
                      strokeLinecap="round"
                      strokeDasharray={dashArray}
                      strokeDashoffset={dashOffset}
                      transform={`rotate(-90)`}
                    />
                  );
                })}

                {/* center text (use SVG text for reliable rendering/centering) */}
                <text
                  x={0}
                  y={-6}
                  textAnchor="middle"
                  fontSize={12}
                  fill="rgba(148,163,184,0.9)"
                >
                  Total
                </text>
                <text
                  x={0}
                  y={18}
                  textAnchor="middle"
                  fontSize={20}
                  fontWeight={700}
                  fill="#fff"
                >
                  {numberToINR(total)}
                </text>
              </g>
            </svg>
          </div>

          {/* Category rows */}
          <div className="flex-1 w-full flex items-center min-w-0">
            <div className="w-full min-w-0">
              <ul className="divide-y divide-border">
                {segments.map((seg) => (
                  <li
                    key={seg.category}
                    className="flex items-center gap-3 px-4 py-3 sm:px-6 hover:bg-accent/40 transition-colors min-w-0 cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/transactions?category=${seg.category}&month=${selectedTimeframe}`
                      )
                    }
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: seg.colorHex }}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {seg.category}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {seg.count} txn{seg.count !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>

                    <div className="w-28 sm:w-40 flex-shrink-0">
                      <div className="flex items-center justify-end gap-3 mb-1">
                        <div className="text-sm font-semibold">
                          {numberToINR(seg.total)}
                        </div>
                      </div>
                      <Progress value={seg.percent} color={seg.colorClass} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

