'use client';
import { useState, useEffect } from 'react';

interface ReportData {
  type: string;
  goals?: any[];
  transactions?: any[];
  activities?: any[];
  participations?: any[];
  issues?: any[];
  audits?: any[];
  policies?: any[];
  scores?: any[];
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  // Custom filters
  const [depts, setDepts] = useState<{ id: number; name: string }[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [employees, setEmployees] = useState<{ id: number; name: string; role: string }[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [challenges, setChallenges] = useState<{ id: number; title: string }[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState('');
  const [categories, setCategories] = useState<{ id: number; name: string; type: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetch('/api/departments').then(r => r.json()).then(setDepts).catch(console.error);
    fetch('/api/users').then(r => r.json()).then(setEmployees).catch(console.error);
    fetch('/api/challenges').then(r => r.json()).then(setChallenges).catch(console.error);
    fetch('/api/categories').then(r => r.json()).then(setCategories).catch(console.error);
  }, []);

  const generateReport = async (type: string) => {
    setReportType(type);
    setLoading(true);
    setReportData(null);
    try {
      let url = `/api/reports?type=${type}`;
      if (type === 'custom') {
        if (selectedDept) url += `&departmentId=${selectedDept}`;
        if (dateFrom) url += `&dateFrom=${dateFrom}`;
        if (dateTo) url += `&dateTo=${dateTo}`;
        if (selectedModule) url += `&module=${selectedModule}`;
        if (selectedEmployee) url += `&employeeId=${selectedEmployee}`;
        if (selectedChallenge) url += `&challengeId=${selectedChallenge}`;
        if (selectedCategory) url += `&categoryId=${selectedCategory}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!reportData) return;
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    if (reportData.type === 'environmental') {
      csvContent += 'Goals Report\nName,Target CO2,Current CO2,Status\n';
      reportData.goals?.forEach((g) => {
        csvContent += `"${g.name}",${g.targetCO2},${g.currentCO2},"${g.status}"\n`;
      });
      csvContent += '\nTransactions Report\nSource,Quantity,Emissions,Date\n';
      reportData.transactions?.forEach((t) => {
        csvContent += `"${t.sourceType}",${t.quantity},${t.calculatedEmissions},"${t.transactionDate}"\n`;
      });
    } else if (reportData.type === 'social') {
      csvContent += 'CSR Activities Report\nTitle,Join Count,Status\n';
      reportData.activities?.forEach((a) => {
        csvContent += `"${a.title}",${a.joinCount},"${a.status}"\n`;
      });
      csvContent += '\nParticipations Report\nEmployee,Activity,Points,Status\n';
      reportData.participations?.forEach((p) => {
        csvContent += `"${p.employee.name}","${p.activity?.title}",${p.pointsEarned},"${p.approvalStatus}"\n`;
      });
    } else if (reportData.type === 'governance') {
      csvContent += 'Governance Policies Report\nTitle,Category,Version,Mandatory\n';
      reportData.policies?.forEach((p) => {
        csvContent += `"${p.title}","${p.category}","${p.version}",${p.mandatory}\n`;
      });
      csvContent += '\nCompliance Issues Report\nTitle,Severity,Status,Due Date\n';
      reportData.issues?.forEach((i) => {
        csvContent += `"${i.title}","${i.severity}","${i.status}","${i.dueDate}"\n`;
      });
    } else if (reportData.type === 'summary') {
      csvContent += 'ESG Scores Summary\nDepartment,Environmental Score,Social Score,Governance Score,Total Score\n';
      reportData.scores?.forEach((s) => {
        csvContent += `"${s.department.name}",${s.environmentalScore},${s.socialScore},${s.governanceScore},${s.totalScore}\n`;
      });
    } else if (reportData.type === 'custom') {
      csvContent += 'Custom ESG Report\n';
      csvContent += '\nCarbon Transactions\nSource,Quantity,Calculated Emissions\n';
      reportData.transactions?.forEach((t) => {
        csvContent += `"${t.sourceType}",${t.quantity},${t.calculatedEmissions}\n`;
      });
      csvContent += '\nSocial Participations\nEmployee,Activity,Points,Status\n';
      reportData.participations?.forEach((p) => {
        csvContent += `"${p.employee.name}","${p.activity?.title}",${p.pointsEarned},"${p.approvalStatus}"\n`;
      });
      csvContent += '\nGovernance Compliance Issues\nTitle,Severity,Status\n';
      reportData.issues?.forEach((i) => {
        csvContent += `"${i.title}","${i.severity}","${i.status}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportData.type}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">ESG Reports</h1>
          <p className="page-subtitle">Generate and download comprehensive ESG reports</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="card card-green" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontWeight: 700 }}>Environmental Report</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
              Carbon footprints, transactions history, and goals progress tracking.
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => generateReport('environmental')}>
            Generate Report
          </button>
        </div>

        <div className="card card-blue" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontWeight: 700 }}>Social Report</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
              CSR activity progress, participation tracking, and community metrics.
            </p>
          </div>
          <button className="btn btn-blue btn-sm" onClick={() => generateReport('social')}>
            Generate Report
          </button>
        </div>

        <div className="card card-purple" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontWeight: 700 }}>Governance Report</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
              Compliance logs, policy updates, and internal audits history.
            </p>
          </div>
          <button className="btn btn-purple btn-sm" onClick={() => generateReport('governance')}>
            Generate Report
          </button>
        </div>

        <div className="card card-orange" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontWeight: 700 }}>ESG Summary</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
              Consolidated scores and rankings across all core ESG dimensions.
            </p>
          </div>
          <button className="btn btn-orange btn-sm" onClick={() => generateReport('summary')}>
            Generate Report
          </button>
        </div>
      </div>

      {/* Custom Report Builder */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontWeight: 700 }}>Custom Report Builder</h3>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'end' }}>
          <div className="form-group" style={{ margin: 0, minWidth: '150px' }}>
            <label className="form-label">Department</label>
            <select
              className="form-select"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <option value="">All Departments</option>
              {depts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0, minWidth: '150px' }}>
            <label className="form-label">Module</label>
            <select
              className="form-select"
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
            >
              <option value="">All Modules</option>
              <option value="environmental">Environmental</option>
              <option value="social">Social</option>
              <option value="governance">Governance</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0, minWidth: '150px' }}>
            <label className="form-label">Employee</label>
            <select
              className="form-select"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">All Employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.role})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0, minWidth: '150px' }}>
            <label className="form-label">Challenge</label>
            <select
              className="form-select"
              value={selectedChallenge}
              onChange={(e) => setSelectedChallenge(e.target.value)}
            >
              <option value="">All Challenges</option>
              {challenges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0, minWidth: '150px' }}>
            <label className="form-label">ESG Category</label>
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Date From</label>
            <input
              type="date"
              className="form-input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Date To</label>
            <input
              type="date"
              className="form-input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" style={{ height: '42px' }} onClick={() => generateReport('custom')}>
            Run Report
          </button>
        </div>
      </div>

      {/* Generated Report Output */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-muted)' }}>⏳ Generating report data...</p>
        </div>
      )}

      {reportData && !loading && (
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '1px solid var(--border-default)',
              paddingBottom: '12px',
            }}
          >
            <h3 style={{ margin: 0, textTransform: 'capitalize', fontWeight: 700 }}>
              {reportType} Report Results
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary btn-sm" onClick={exportCSV}>
                Export: CSV
              </button>
              <button className="btn btn-secondary btn-sm" style={{ opacity: 0.5, cursor: 'not-allowed' }} disabled>
                Export: PDF
              </button>
              <button className="btn btn-secondary btn-sm" style={{ opacity: 0.5, cursor: 'not-allowed' }} disabled>
                Export: Excel
              </button>
            </div>
          </div>

          {/* Environmental Report View */}
          {reportType === 'environmental' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h4 style={{ margin: '0 0 10px 0', color: 'var(--accent-green)' }}>Goals</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Target CO2</th>
                      <th>Current CO2</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.goals?.map((g: any) => (
                      <tr key={g.id}>
                        <td>{g.name}</td>
                        <td>{g.targetCO2} t</td>
                        <td>{g.currentCO2} t</td>
                        <td>
                          <span className={`badge ${g.status === 'Completed' ? 'badge-green' : 'badge-blue'}`}>
                            {g.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 style={{ margin: '0 0 10px 0', color: 'var(--accent-green)' }}>Transactions</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Quantity</th>
                      <th>Emissions</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.transactions?.map((t: any) => (
                      <tr key={t.id}>
                        <td>{t.sourceType}</td>
                        <td>{t.quantity}</td>
                        <td>{t.calculatedEmissions.toFixed(2)} kg CO2e</td>
                        <td>{new Date(t.transactionDate).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Social Report View */}
          {reportType === 'social' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h4 style={{ margin: '0 0 10px 0', color: 'var(--accent-blue)' }}>CSR Activities</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Join Count</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.activities?.map((a: any) => (
                      <tr key={a.id}>
                        <td>{a.title}</td>
                        <td>{a.joinCount} joined</td>
                        <td>
                          <span className={`badge ${a.status === 'Open' ? 'badge-green' : 'badge-gray'}`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 style={{ margin: '0 0 10px 0', color: 'var(--accent-blue)' }}>Approved Participations</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Activity</th>
                      <th>Points Earned</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.participations?.map((p: any) => (
                      <tr key={p.id}>
                        <td>{p.employee.name}</td>
                        <td>{p.activity?.title || p.challenge?.title}</td>
                        <td>{p.pointsEarned} pts</td>
                        <td>
                          <span className="badge badge-green">{p.approvalStatus}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Governance Report View */}
          {reportType === 'governance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h4 style={{ margin: '0 0 10px 0', color: 'var(--accent-purple)' }}>Policies</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Version</th>
                      <th>Mandatory</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.policies?.map((p: any) => (
                      <tr key={p.id}>
                        <td>{p.title}</td>
                        <td>{p.category}</td>
                        <td>v{p.version}</td>
                        <td>{p.mandatory ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 style={{ margin: '0 0 10px 0', color: 'var(--accent-purple)' }}>Compliance Issues</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Severity</th>
                      <th>Status</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.issues?.map((i: any) => (
                      <tr key={i.id}>
                        <td>{i.title}</td>
                        <td>{i.severity}</td>
                        <td>{i.status}</td>
                        <td>{new Date(i.dueDate).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ESG Summary Report View */}
          {reportType === 'summary' && (
            <div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Environmental Score</th>
                    <th>Social Score</th>
                    <th>Governance Score</th>
                    <th>Total score</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.scores?.map((s: any) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.department.name}</td>
                      <td>{s.environmentalScore}/100</td>
                      <td>{s.socialScore}/100</td>
                      <td>{s.governanceScore}/100</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{s.totalScore}/100</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Custom Report View */}
          {reportType === 'custom' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h4 style={{ margin: '0 0 10px 0' }}>Carbon Logs</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Source</th>
                      <th>Quantity</th>
                      <th>Calculated Emissions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.transactions?.map((t: any) => (
                      <tr key={t.id}>
                        <td>{t.department?.name}</td>
                        <td>{t.sourceType}</td>
                        <td>{t.quantity}</td>
                        <td>{t.calculatedEmissions.toFixed(2)} kg CO2e</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 style={{ margin: '0 0 10px 0' }}>CSR & Challenge Participations</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Activity / Challenge</th>
                      <th>Points</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.participations?.map((p: any) => (
                      <tr key={p.id}>
                        <td>{p.employee.name}</td>
                        <td>{p.activity?.title || p.challenge?.title}</td>
                        <td>{p.pointsEarned} pts</td>
                        <td>{p.approvalStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 style={{ margin: '0 0 10px 0' }}>Compliance Issues</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Severity</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.issues?.map((i: any) => (
                      <tr key={i.id}>
                        <td>{i.title}</td>
                        <td>{i.severity}</td>
                        <td>{i.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
