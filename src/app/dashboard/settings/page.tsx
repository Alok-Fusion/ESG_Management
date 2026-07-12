'use client';
import { useState, useEffect } from 'react';

interface Dept {
  id: number;
  name: string;
  code: string;
  employeeCount: number;
  status: string;
  headUserId: number | null;
  parentDepartmentId: number | null;
}

interface Cat {
  id: number;
  name: string;
  type: string;
  status: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'departments' | 'categories' | 'esg' | 'notifications'>('departments');

  // Departments State
  const [depts, setDepts] = useState<Dept[]>([]);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '', code: '', employeeCount: '', status: 'Active', headUserId: '', parentDepartmentId: '' });

  // Categories State
  const [categories, setCategories] = useState<Cat[]>([]);
  const [showCatModal, setShowCatModal] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', type: 'CSR_Activity' });

  // ESG Config State
  const [configs, setConfigs] = useState<Record<string, string>>({
    auto_emission_calculation: 'true',
    require_evidence: 'true',
    auto_award_badges: 'true',
    email_compliance_alerts: 'true',
    weight_environmental: '40',
    weight_social: '30',
    weight_governance: '30',
  });

  // Notification Settings State (client-only toggles for demonstration)
  const [notifSettings, setNotifSettings] = useState({
    compliance_inapp: true,
    compliance_email: true,
    participation_inapp: true,
    participation_email: false,
    badge_inapp: true,
    badge_email: false,
    policy_inapp: true,
    policy_email: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const dRes = await fetch('/api/departments');
      const dData = await dRes.json();
      setDepts(dData);

      const cRes = await fetch('/api/categories');
      const cData = await cRes.json();
      setCategories(cData);

      const sRes = await fetch('/api/settings');
      const sData = await sRes.json();
      if (Object.keys(sData).length > 0) {
        setConfigs((prev) => ({ ...prev, ...sData }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Department Actions
  const handleCreateDept = async () => {
    const res = await fetch('/api/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deptForm),
    });
    if (res.ok) {
      fetchData();
      setShowDeptModal(false);
      setDeptForm({ name: '', code: '', employeeCount: '', status: 'Active', headUserId: '', parentDepartmentId: '' });
    }
  };

  const handleDeleteDept = async (id: number) => {
    if (!confirm('Delete this department?')) return;
    const res = await fetch(`/api/departments?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchData();
  };

  // Category Actions
  const handleCreateCat = async () => {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(catForm),
    });
    if (res.ok) {
      fetchData();
      setShowCatModal(false);
      setCatForm({ name: '', type: 'CSR_Activity' });
    }
  };

  const handleDeleteCat = async (id: number) => {
    if (!confirm('Delete this category?')) return;
    const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchData();
  };

  // Save ESG Configurations
  const saveESGConfig = async (newConfigs: Record<string, string>) => {
    setConfigs(newConfigs);
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfigs),
    });
  };

  // Recalculate Scores Trigger
  const triggerRecalculate = async () => {
    const res = await fetch('/api/scores/recalculate', { method: 'POST' });
    if (res.ok) {
      alert('Scores recalculated and updated successfully!');
    } else {
      alert('Failed to recalculate scores.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Platform configuration, department hierarchy, and ESG settings</p>
        </div>
      </div>

      <div className="tab-pills" style={{ marginBottom: '28px' }}>
        <button
          className={`tab-pill ${activeTab === 'departments' ? 'active' : ''}`}
          onClick={() => setActiveTab('departments')}
        >
          Departments
        </button>
        <button
          className={`tab-pill ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Categories
        </button>
        <button
          className={`tab-pill ${activeTab === 'esg' ? 'active' : ''}`}
          onClick={() => setActiveTab('esg')}
        >
          ESG Configuration
        </button>
        <button
          className={`tab-pill ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          Notification Settings
        </button>
      </div>

      {/* Departments Tab */}
      {activeTab === 'departments' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontWeight: 700 }}>Department Hierarchies</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowDeptModal(true)}>
              + Add Department
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Employees</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {depts.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 700 }}>{d.code}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.name}</td>
                    <td>{d.employeeCount} employees</td>
                    <td>
                      <span className={`badge ${d.status === 'Active' ? 'badge-green' : 'badge-gray'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteDept(d.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontWeight: 700 }}>ESG Categories</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCatModal(true)}>
              + Add Category
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</td>
                    <td>
                      <span className={`badge ${c.type === 'CSR_Activity' ? 'badge-blue' : 'badge-orange'}`}>
                        {c.type}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-green">{c.status}</span>
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCat(c.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ESG Configuration Tab */}
      {activeTab === 'esg' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card card-green">
            <h3 style={{ margin: '0 0 16px 0', fontWeight: 700 }}>System Control Toggles</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Enable auto emission calculation</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                    Computes carbon footprint using activity factor values automatically.
                  </p>
                </div>
                <div
                  className={`toggle-switch ${configs.auto_emission_calculation === 'true' ? 'active' : ''}`}
                  onClick={() =>
                    saveESGConfig({
                      ...configs,
                      auto_emission_calculation: configs.auto_emission_calculation === 'true' ? 'false' : 'true',
                    })
                  }
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Require evidence for all CSR activities</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                    Requires proof attachments to approve CSR and employee participations.
                  </p>
                </div>
                <div
                  className={`toggle-switch ${configs.require_evidence === 'true' ? 'active' : ''}`}
                  onClick={() =>
                    saveESGConfig({
                      ...configs,
                      require_evidence: configs.require_evidence === 'true' ? 'false' : 'true',
                    })
                  }
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Auto-award badges on challenge completion</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                    Automatically evaluates and unlocks user badges on mutations.
                  </p>
                </div>
                <div
                  className={`toggle-switch ${configs.auto_award_badges === 'true' ? 'active' : ''}`}
                  onClick={() =>
                    saveESGConfig({
                      ...configs,
                      auto_award_badges: configs.auto_award_badges === 'true' ? 'false' : 'true',
                    })
                  }
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Email alerts for new compliance issues</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                    Triggers automated email notification alerts to assigned owners.
                  </p>
                </div>
                <div
                  className={`toggle-switch ${configs.email_compliance_alerts === 'true' ? 'active' : ''}`}
                  onClick={() =>
                    saveESGConfig({
                      ...configs,
                      email_compliance_alerts: configs.email_compliance_alerts === 'true' ? 'false' : 'true',
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="card card-blue">
            <h3 style={{ margin: '0 0 16px 0', fontWeight: 700 }}>Scoring Engine Weights</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label className="form-label">Environmental Score Weight</label>
                  <span style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{configs.weight_environmental}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  className="range-slider"
                  value={configs.weight_environmental}
                  onChange={(e) => saveESGConfig({ ...configs, weight_environmental: e.target.value })}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label className="form-label">Social Score Weight</label>
                  <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{configs.weight_social}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  className="range-slider"
                  value={configs.weight_social}
                  onChange={(e) => saveESGConfig({ ...configs, weight_social: e.target.value })}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label className="form-label">Governance Score Weight</label>
                  <span style={{ fontWeight: 700, color: 'var(--accent-purple)' }}>{configs.weight_governance}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  className="range-slider"
                  value={configs.weight_governance}
                  onChange={(e) => saveESGConfig({ ...configs, weight_governance: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button className="btn btn-primary" onClick={triggerRecalculate}>
                  🔄 Recalculate Department Scores
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Settings Tab */}
      {activeTab === 'notifications' && (
        <div className="card card-purple">
          <h3 style={{ margin: '0 0 16px 0', fontWeight: 700 }}>Notification Dispatch Rules</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Compliance Issues Alert</h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                  Trigger notifications when a new compliance issue is created.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px' }}>In-App</span>
                  <div
                    className={`toggle-switch ${notifSettings.compliance_inapp ? 'active' : ''}`}
                    onClick={() => setNotifSettings({ ...notifSettings, compliance_inapp: !notifSettings.compliance_inapp })}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Email (Locked)</span>
                  <div className="toggle-switch active" style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Participation Status Update</h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                  Notify user when their CSR or challenge participation is approved/rejected.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px' }}>In-App</span>
                  <div
                    className={`toggle-switch ${notifSettings.participation_inapp ? 'active' : ''}`}
                    onClick={() => setNotifSettings({ ...notifSettings, participation_inapp: !notifSettings.participation_inapp })}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Email (Locked)</span>
                  <div className="toggle-switch" style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Badges & Achievement Alerts</h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                  Notify user when a new badge/achievement has been unlocked.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px' }}>In-App</span>
                  <div
                    className={`toggle-switch ${notifSettings.badge_inapp ? 'active' : ''}`}
                    onClick={() => setNotifSettings({ ...notifSettings, badge_inapp: !notifSettings.badge_inapp })}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Email (Locked)</span>
                  <div className="toggle-switch" style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Policy Acknowledgment Reminder</h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                  Daily remind users for mandatory policy acknowledgements pending over 3 days.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px' }}>In-App</span>
                  <div
                    className={`toggle-switch ${notifSettings.policy_inapp ? 'active' : ''}`}
                    onClick={() => setNotifSettings({ ...notifSettings, policy_inapp: !notifSettings.policy_inapp })}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Email (Locked)</span>
                  <div className="toggle-switch active" style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Department Modal */}
      {showDeptModal && (
        <div className="modal-overlay" onClick={() => setShowDeptModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Department</h2>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-input"
                value={deptForm.name}
                onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Code</label>
              <input
                type="text"
                className="form-input"
                value={deptForm.code}
                onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Employee Count</label>
              <input
                type="number"
                className="form-input"
                value={deptForm.employeeCount}
                onChange={(e) => setDeptForm({ ...deptForm, employeeCount: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-primary" onClick={handleCreateDept}>
                Create Department
              </button>
              <button className="btn btn-secondary" onClick={() => setShowDeptModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <div className="modal-overlay" onClick={() => setShowCatModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Category</h2>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-input"
                value={catForm.name}
                onChange={(e) => setFormCat(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                className="form-select"
                value={catForm.type}
                onChange={(e) => setCatForm({ ...catForm, type: e.target.value })}
              >
                <option value="CSR_Activity">CSR Activity</option>
                <option value="Challenge">Challenge</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-primary" onClick={handleCreateCat}>
                Create Category
              </button>
              <button className="btn btn-secondary" onClick={() => setShowCatModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function setFormCat(val: string) {
    setCatForm({ ...catForm, name: val });
  }
}
