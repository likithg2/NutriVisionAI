import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function CalorieTrend({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="mintGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FF6B4A" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#FF6B4A" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#6b7f75" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#6b7f75" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "rgba(20,29,25,0.85)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
          labelStyle={{ color: "#e8f5ee" }}
        />
        <Area type="monotone" dataKey="calories" stroke="#FF6B4A" strokeWidth={2} fill="url(#mintGrad)" dot={false} activeDot={{ r: 4, fill: "#FF6B4A", strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
