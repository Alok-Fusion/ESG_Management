'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface FootprintLog {
  id: number;
  commuteMode: string;
  commuteKm: number;
  electricityKwh: number;
  mealType: string;
  totalCO2Kg: number;
  logDate: string;
}

interface Breakdown {
  commute: number;
  electricity: number;
  meals: number;
}

export default function CarbonCalculatorPage() {
  const [commuteMode, setCommuteMode] = useState('car');
  const [commuteKm, setCommuteKm] = useState(20);
  const [electricityKwh, setElectricityKwh] = useState(8);
  const [mealType, setMealType] = useState('mixed');
  const [result, setResult] = useState<{ totalCO2Kg: number; breakdown: Breakdown } | null>(null);
  const [history, setHistory] = useState<FootprintLog[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/carbon-calculator/history').then(r => r.json()).then(setHistory).catch(() => {});
  }, []);

  const calculate = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/carbon-calculator/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commuteMode, commuteKm, electricityKwh, mealType }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ totalCO2Kg: data.totalCO2Kg, breakdown: data.breakdown });
        // Refresh history
        const hist = await fetch('/api/carbon-calculator/history').then(r => r.json());
        setHistory(hist);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const chartData = history.slice(0, 14).reverse().map(h => ({
    date: new Date(h.logDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    co2: h.totalCO2Kg,
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Carbon Footprint Calculator</h1>
          <p className="page-subtitle">Estimate your daily personal carbon footprint</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Calculator Form */}
        <div className="chart-card">
          <h3>Daily Input</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
            {/* Commute */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Commute Mode
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { value: 'car', label: 'Car' },
                  { value: 'bus', label: 'Bus/Train' },
                  { value: 'bike', label: 'Bicycle' },
                  { value: 'walk', label: 'Walk' },
                  { value: 'wfh', label: 'Work From Home' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setCommuteMode(opt.value)}
                    className={`btn ${commuteMode === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '12px', padding: '6px 14px' }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Distance */}
            {commuteMode !== 'wfh' && commuteMode !== 'walk' && (
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  Distance (km round-trip): {commuteKm}
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={commuteKm}
                  onChange={e => setCommuteKm(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-green)' }}
                />
              </div>
            )}

            {/* Electricity */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Electricity Usage (kWh): {electricityKwh}
              </label>
              <input
                type="range"
                min={0}
                max={50}
                value={electricityKwh}
                onChange={e => setElectricityKwh(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-blue)' }}
              />
            </div>

            {/* Meals */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Meal Type Today
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { value: 'vegan', label: 'Vegan' },
                  { value: 'vegetarian', label: 'Vegetarian' },
                  { value: 'mixed', label: 'Mixed' },
                  { value: 'meat_heavy', label: 'Meat-Heavy' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setMealType(opt.value)}
                    className={`btn ${mealType === opt.value ? 'btn-orange' : 'btn-secondary'}`}
                    style={{ fontSize: '12px', padding: '6px 14px' }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={calculate}
              disabled={submitting}
              style={{ marginTop: '8px' }}
            >
              {submitting ? 'Calculating...' : 'Calculate & Log'}
            </button>
          </div>
        </div>

        {/* Result Card */}
        <div className="chart-card">
          <h3>Your Estimate</h3>
          {result ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{
                fontSize: '56px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, var(--accent-green), var(--accent-blue))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1,
              }}>
                {result.totalCO2Kg}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>kg CO2e today</div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '28px', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-green)' }}>{result.breakdown.commute}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Commute</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-blue)' }}>{result.breakdown.electricity}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Electricity</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-orange)' }}>{result.breakdown.meals}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Meals</div>
                </div>
              </div>

              {result.totalCO2Kg < 10 && (
                <div style={{ marginTop: '20px', padding: '10px 16px', background: 'var(--accent-green-dim)', borderRadius: '8px', fontSize: '13px', color: 'var(--accent-green)' }}>
                  Great job! Your footprint is below average today.
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
              Fill in your daily activities and click Calculate to see your carbon footprint estimate.
            </div>
          )}
        </div>
      </div>

      {/* History Chart */}
      {chartData.length > 0 && (
        <div className="chart-card" style={{ marginTop: '24px' }}>
          <h3>Your CO2 History (Last 14 entries)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
              <XAxis dataKey="date" tick={{ fill: '#5a5a70', fontSize: 11 }} />
              <YAxis tick={{ fill: '#5a5a70', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#16161e', border: '1px solid #2a2a3a', borderRadius: '8px', color: '#e8e8ed' }}
              />
              <Bar dataKey="co2" fill="#22c55e" radius={[6, 6, 0, 0]} barSize={28} name="kg CO2e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
