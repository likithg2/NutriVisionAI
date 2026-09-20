import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["#FF6B4A","#60a5fa","#f59e0b","#f87171","#a78bfa","#34d399"];

export default function CategoryBar({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="category" tick={{ fontSize: 11, fill: "#6b7f75" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#6b7f75" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "rgba(20,29,25,0.85)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
          labelStyle={{ color: "#e8f5ee" }}
        />
        <Bar dataKey="count" radius={[6,6,0,0]}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
