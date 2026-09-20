import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#FF6B4A", "#60a5fa", "#f59e0b"];

export default function MacroDonut({ protein = 0, carbs = 0, fat = 0 }) {
  const data = [
    { name: "Protein", value: Math.round(protein) },
    { name: "Carbs", value: Math.round(carbs) },
    { name: "Fat", value: Math.round(fat) },
  ].filter(d => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-40 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={48} outerRadius={64} paddingAngle={3} dataKey="value" strokeWidth={0}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: "rgba(20,29,25,0.85)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
              labelStyle={{ color: "#e8f5ee" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold">{total}g</span>
          <span className="text-xs text-zinc-400">macros</span>
        </div>
      </div>
      <div className="flex gap-4 text-xs">
        {[["Protein","#FF6B4A"], ["Carbs","#60a5fa"], ["Fat","#f59e0b"]].map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
