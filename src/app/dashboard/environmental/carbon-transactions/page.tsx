'use client';
import { useState, useEffect } from 'react';

interface Transaction { id: number; sourceType: string; quantity: number; calculatedEmissions: number; transactionDate: string; department: { name: string }; emissionFactor: { activityType: string; unit: string } }
interface EF { id: number; activityType: string; factorValue: number; unit: string }
interface Dept { id: number; name: string }

export default function CarbonTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [factors, setFactors] = useState<EF[]>([]);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [form, setForm] = useState({ departmentId: '', sourceType: 'Manufacturing', quantity: '', emissionFactorId: '' });
  const [userRole, setUserRole] = useState<string>('Employee');
  const [userDeptId, setUserDeptId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/carbon-transactions').then(r => r.json()).then(setTransactions);
    fetch('/api/emission-factors').then(r => r.json()).then(setFactors);
    fetch('/api/departments').then(r => r.json()).then(setDepts);
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) {
        setUserRole(d.user.role);
        if (d.user.departmentId) {
          setUserDeptId(d.user.departmentId);
          setForm(f => ({ ...f, departmentId: String(d.user.departmentId) }));
        }
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/carbon-transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) {
      fetch('/api/carbon-transactions').then(r => r.json()).then(setTransactions);
      setForm(f => ({ ...f, quantity: '', emissionFactorId: '' }));
    }
  };

  const selectedFactor = factors.find(f => f.id === parseInt(form.emissionFactorId));
  const estimatedEmissions = selectedFactor && form.quantity ? (parseFloat(form.quantity) * selectedFactor.factorValue).toFixed(2) : '—';

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Carbon Transactions</h1><p className="page-subtitle">Log and track carbon emissions data</p></div></div>

      {userRole !== 'Employee' && (
        <div className="card card-green" style={{ marginBottom: '28px' }}>
          <h3 style={{ margin: '0 0 18px', fontSize: '15px', fontWeight: 700 }}>📊 Log New Transaction</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '14px', alignItems: 'end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Department</label>
              <select
                className="form-select"
                value={form.departmentId}
                onChange={e => setForm({...form, departmentId: e.target.value})}
                required
                disabled={userRole === 'Manager'}
              >
                {userRole === 'Manager' ? (
                  depts.filter(d => d.id === userDeptId).map(d => <option key={d.id} value={d.id}>{d.name}</option>)
                ) : (
                  <>
                    <option value="">Select...</option>
                    {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </>
                )}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Source Type</label><select className="form-select" value={form.sourceType} onChange={e => setForm({...form, sourceType: e.target.value})}><option>Purchase</option><option>Manufacturing</option><option>Expense</option><option>Fleet</option><option>Manual</option></select></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Quantity</label><input type="number" step="0.01" className="form-input" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} placeholder="Amount" required /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Emission Factor</label><select className="form-select" value={form.emissionFactorId} onChange={e => setForm({...form, emissionFactorId: e.target.value})} required><option value="">Select...</option>{factors.map(f => <option key={f.id} value={f.id}>{f.activityType} ({f.factorValue} kg/{f.unit})</option>)}</select></div>
            <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>Log</button>
          </form>
          {form.quantity && form.emissionFactorId && <p style={{ fontSize: '13px', color: 'var(--accent-green)', marginTop: '10px', marginBottom: 0 }}>Estimated emissions: <strong>{estimatedEmissions} kg CO₂e</strong></p>}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Date</th><th>Department</th><th>Source</th><th>Quantity</th><th>Factor</th><th>Emissions (kg CO₂e)</th></tr></thead>
          <tbody>
            {transactions.slice(0, 20).map(t => (
              <tr key={t.id}>
                <td>{new Date(t.transactionDate).toLocaleDateString()}</td>
                <td>{t.department?.name}</td>
                <td><span className="badge badge-green">{t.sourceType}</span></td>
                <td>{t.quantity} {t.emissionFactor?.unit}</td>
                <td>{t.emissionFactor?.activityType}</td>
                <td style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{t.calculatedEmissions.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
