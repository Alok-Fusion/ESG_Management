'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const deptDiversity = [
  { name: 'Manufacturing', male: 78, female: 52, other: 4 },
  { name: 'Logistics', male: 34, female: 22, other: 2 },
  { name: 'Corporate', male: 18, female: 21, other: 2 },
  { name: 'Sales', male: 14, female: 12, other: 1 },
  { name: 'R&D', male: 10, female: 8, other: 1 },
];

const overallGender = [
  { name: 'Male', value: 154, color: '#3b82f6' },
  { name: 'Female', value: 115, color: '#a855f7' },
  { name: 'Non-Binary', value: 10, color: '#22c55e' },
];

export default function DiversityPage() {
  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Diversity Dashboard</h1><p className="page-subtitle">Workforce diversity metrics and analysis</p></div></div>

      <div className="kpi-grid">
        <div className="kpi-tile blue"><div className="kpi-label">Total Employees</div><div className="kpi-value" style={{ color: 'var(--accent-blue)' }}>279</div></div>
        <div className="kpi-tile purple"><div className="kpi-label">Gender Ratio (F:M)</div><div className="kpi-value" style={{ color: 'var(--accent-purple)' }}>42<span className="unit">%</span></div></div>
        <div className="kpi-tile green"><div className="kpi-label">Departments</div><div className="kpi-value" style={{ color: 'var(--accent-green)' }}>5</div></div>
        <div className="kpi-tile overall"><div className="kpi-label">Diversity Index</div><div className="kpi-value">0.74</div></div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Gender Distribution by Department</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deptDiversity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
              <XAxis dataKey="name" tick={{ fill: '#5a5a70', fontSize: 11 }} />
              <YAxis tick={{ fill: '#5a5a70', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#16161e', border: '1px solid #2a2a3a', borderRadius: '8px', color: '#e8e8ed' }} />
              <Bar dataKey="male" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="female" fill="#a855f7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="other" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Overall Gender Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={overallGender} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${percent !== undefined ? (percent * 100).toFixed(0) : '0'}%`}>
                {overallGender.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#16161e', border: '1px solid #2a2a3a', borderRadius: '8px', color: '#e8e8ed' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
