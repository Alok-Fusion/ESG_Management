'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface DashboardData {
  kpis: { environmental: number; social: number; governance: number; overall: number };
  emissionsTrend: { month: string; emissions: number }[];
  departmentRanking: { name: string; score: number }[];
  recentActivity: { type: string; text: string; status: string; time: string }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [insight, setInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData).catch(console.error);
  }, []);

  const generateInsight = async () => {
    setInsightLoading(true);
    try {
      const res = await fetch('/api/insights/generate', { method: 'POST' });
      const d = await res.json();
      setInsight(d.insight || d.error || 'Unable to generate insight');
    } catch {
      setInsight('Failed to connect to AI service.');
    } finally {
      setInsightLoading(false);
    }
  };

  if (!data) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">ESG Performance Overview</p>
          </div>
        </div>
        <div className="kpi-grid">
          {[1,2,3,4].map(i => (
            <div key={i} className="kpi-tile"><div className="skeleton" style={{height:'60px',width:'120px'}} /></div>
          ))}
        </div>
      </div>
    );
  }

  const { kpis, emissionsTrend, departmentRanking, recentActivity } = data;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">ESG Performance Overview</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/dashboard/environmental/carbon-transactions" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            + Log Carbon Data
          </Link>
          <Link href="/dashboard/gamification/challenges" className="btn btn-orange" style={{ textDecoration: 'none' }}>
            Start Challenge
          </Link>
          <Link href="/dashboard/reports" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            View Reports
          </Link>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="kpi-grid">
        <div className="kpi-tile green">
          <div className="kpi-label">Environmental</div>
          <div className="kpi-value">{kpis.environmental}<span className="unit">/100</span></div>
        </div>
        <div className="kpi-tile blue">
          <div className="kpi-label">Social</div>
          <div className="kpi-value">{kpis.social}<span className="unit">/100</span></div>
        </div>
        <div className="kpi-tile purple">
          <div className="kpi-label">Governance</div>
          <div className="kpi-value">{kpis.governance}<span className="unit">/100</span></div>
        </div>
        <div className="kpi-tile overall">
          <div className="kpi-label">Overall ESG</div>
          <div className="kpi-value">{kpis.overall}<span className="unit">/100</span></div>
        </div>
      </div>

      {/* AI Insight */}
      <div className="insight-card">
        <h3>AI Insight Generator</h3>
        {insight ? (
          <div>
            <p className="insight-text">{insight}</p>
            <button className="btn btn-secondary btn-sm" onClick={generateInsight} disabled={insightLoading} style={{ marginTop: '14px' }}>
              {insightLoading ? 'Regenerating...' : 'Regenerate'}
            </button>
          </div>
        ) : (
          <div>
            <p className="insight-text" style={{ color: 'var(--text-muted)' }}>
              Click below to generate an AI-powered analysis of your ESG performance.
            </p>
            <button className="btn btn-primary btn-sm" onClick={generateInsight} disabled={insightLoading} style={{ marginTop: '14px' }}>
              {insightLoading ? 'Generating...' : 'Generate Insight'}
            </button>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Emissions Trend (12 Months)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={emissionsTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
              <XAxis
                dataKey="month"
                tick={{ fill: '#5a5a70', fontSize: 11 }}
                tickFormatter={(v) => {
                  const parts = v.split('-');
                  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                  return months[parseInt(parts[1])-1] || v;
                }}
              />
              <YAxis tick={{ fill: '#5a5a70', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#16161e', border: '1px solid #2a2a3a', borderRadius: '8px', color: '#e8e8ed' }}
                labelStyle={{ color: '#8b8b9e' }}
              />
              <Line type="monotone" dataKey="emissions" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: '#22c55e', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Department ESG Ranking</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={departmentRanking} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#5a5a70', fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#8b8b9e', fontSize: 12 }} width={100} />
              <Tooltip
                contentStyle={{ background: '#16161e', border: '1px solid #2a2a3a', borderRadius: '8px', color: '#e8e8ed' }}
              />
              <Bar dataKey="score" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="chart-card">
        <h3>Recent Activity</h3>
        <div className="activity-feed">
          {recentActivity.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No recent activity</p>
          ) : (
            recentActivity.map((item, i) => (
              <div key={i} className="activity-item">
                <div className="activity-icon" style={{
                  background: item.type === 'participation' ? 'var(--accent-blue-dim)' :
                    item.type === 'compliance' ? 'var(--accent-purple-dim)' : 'var(--accent-green-dim)',
                }}>
                  {item.type === 'participation' ? '👥' : item.type === 'compliance' ? '⚠️' : '📊'}
                </div>
                <div>
                  <div className="activity-text">{item.text}</div>
                  <div className="activity-time">
                    <span className={`badge ${
                      item.status === 'Approved' ? 'badge-green' :
                      item.status === 'Pending' ? 'badge-yellow' :
                      item.status === 'Open' ? 'badge-red' :
                      item.status === 'Resolved' ? 'badge-green' : 'badge-gray'
                    }`}>{item.status}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
