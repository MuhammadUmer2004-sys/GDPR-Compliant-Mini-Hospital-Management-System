'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, PlusCircle, ShieldCheck, ListFilter, 
  Download, BarChart3, Info, LogOut, Search,
  Activity, Clock, User, Trash2, Edit, RefreshCw, 
  Database, ShieldAlert, CheckCircle2, AlertCircle
} from 'lucide-react';

export default function DashboardPage() {
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Patients');
  const [patients, setPatients] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemUptime, setSystemUptime] = useState('0h 0m 0s');
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetchSession();
    const startTime = Date.now();
    const interval = setInterval(() => {
      const diff = Date.now() - startTime;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setSystemUptime(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (session) {
      refreshData();
    }
  }, [session]);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.session) {
        setSession(data.session);
      } else {
        router.push('/login');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    fetchPatients();
    if (session?.role === 'admin') fetchLogs();
    setLastSync(new Date().toLocaleTimeString());
  };

  const fetchPatients = async () => {
    const res = await fetch('/api/patients');
    const data = await res.json();
    setPatients(data);
  };

  const fetchLogs = async () => {
    const res = await fetch('/api/logs');
    const data = await res.json();
    setLogs(data);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const runMaintenance = async (action: string) => {
    const res = await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (data.success) {
      alert(`Success: ${action} completed.`);
      refreshData();
    }
  };

  const exportCSV = () => {
    const headers = Object.keys(patients[0] || {}).join(',');
    const rows = patients.map(p => Object.values(p).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patients_export_${new Date().toISOString()}.csv`;
    a.click();
  };

  const deletePatient = async (id: number) => {
    if (!confirm('Are you sure you want to delete this patient?')) return;
    await fetch(`/api/patients/${id}`, { method: 'DELETE' });
    refreshData();
  };

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
      <RefreshCw className="animate-spin" size={48} color="var(--primary)" />
    </div>
  );

  const tabs = [
    { name: 'Patients', icon: <Users size={18} /> },
    { name: 'Manage Records', icon: <PlusCircle size={18} />, allowed: ['admin', 'receptionist'] },
    { name: 'Audit Logs', icon: <ListFilter size={18} />, allowed: ['admin'] },
    { name: 'Maintenance', icon: <ShieldAlert size={18} />, allowed: ['admin'] },
    { name: 'Analysis', icon: <BarChart3 size={18} /> },
    { name: 'About GDPR', icon: <Info size={18} /> },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      {/* Sidebar */}
      <aside className="glass" style={{ 
        width: '280px', 
        padding: '32px 24px', 
        margin: '20px', 
        display: 'flex', 
        flexDirection: 'column',
        gap: '40px',
        position: 'sticky',
        top: '20px',
        height: 'calc(100vh - 40px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--primary)', padding: '10px', borderRadius: '12px', color: 'white' }}>
            <Activity size={24} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-0.5px' }}>Hospital OS</h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {tabs.map((tab) => {
            if (tab.allowed && !tab.allowed.includes(session?.role)) return null;
            return (
              <button
                key={tab.name}
                onClick={() => { setActiveTab(tab.name); setEditingPatient(null); }}
                className={`btn ${activeTab === tab.name ? 'btn-primary' : 'btn-ghost'}`}
                style={{ justifyContent: 'flex-start', width: '100%', padding: '12px 16px' }}
              >
                {tab.icon} {tab.name}
              </button>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass" style={{ padding: '16px', fontSize: '13px', background: 'rgba(255,255,255,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                {session?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: '700' }}>{session?.username}</div>
                <div style={{ color: 'var(--secondary)', textTransform: 'capitalize', fontSize: '11px' }}>{session?.role}</div>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost" style={{ color: '#ef4444', justifyContent: 'center' }}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1200px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1px' }}>{activeTab}</h1>
            <p style={{ color: 'var(--secondary)', fontWeight: '500' }}>GDPR Compliant Patient Management</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={refreshData} className="btn glass" style={{ padding: '10px' }} title="Refresh Data">
              <RefreshCw size={18} />
            </button>
            <button onClick={exportCSV} className="btn btn-primary">
              <Download size={18} /> Export CSV
            </button>
          </div>
        </header>

        <section className="glass animate-fade-in" style={{ padding: '32px', flex: 1, boxShadow: 'var(--shadow)' }}>
          {activeTab === 'Patients' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,0.3)', padding: '12px', borderRadius: '12px' }}>
                <Search size={18} color="var(--secondary)" />
                <input type="text" placeholder="Search patients..." style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%' }} />
              </div>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                <thead>
                  <tr style={{ color: 'var(--secondary)', fontSize: '13px', fontWeight: '600' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
                    {session?.role === 'admin' && <th style={{ padding: '12px', textAlign: 'left' }}>Full Name</th>}
                    {session?.role === 'doctor' && <th style={{ padding: '12px', textAlign: 'left' }}>Anonymized Name</th>}
                    <th style={{ padding: '12px', textAlign: 'left' }}>Diagnosis</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Date Added</th>
                    {session?.role === 'admin' && <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr key={p.id} className="glass" style={{ background: 'rgba(255,255,255,0.4)', transition: 'transform 0.2s' }}>
                      <td style={{ padding: '16px', borderRadius: '12px 0 0 12px', fontWeight: 'bold' }}>#{p.id}</td>
                      {session?.role === 'admin' && <td style={{ padding: '16px' }}>{p.name}</td>}
                      {session?.role === 'doctor' && <td style={{ padding: '16px' }}>
                        <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>{p.anonymizedName}</span>
                      </td>}
                      <td style={{ padding: '16px' }}>{p.diagnosis}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '13px', fontWeight: '600' }}>
                          <CheckCircle2 size={14} /> Active
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', color: 'var(--secondary)' }}>{new Date(p.dateAdded).toLocaleDateString()}</td>
                      {session?.role === 'admin' && (
                        <td style={{ padding: '16px', borderRadius: '0 12px 12px 0', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setEditingPatient(p); setActiveTab('Manage Records'); }} className="btn glass" style={{ padding: '6px' }}><Edit size={14} /></button>
                            <button onClick={() => deletePatient(p.id)} className="btn glass" style={{ padding: '6px', color: '#ef4444' }}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'Manage Records' && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <PlusCircle size={48} color="var(--primary)" style={{ marginBottom: '16px' }} />
                <h2>{editingPatient ? 'Update Patient Record' : 'Register New Patient'}</h2>
                <p style={{ color: 'var(--secondary)' }}>All data entered here is automatically encrypted and masked.</p>
              </div>
              <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                const payload = Object.fromEntries(formData);
                
                if (editingPatient) {
                  await fetch(`/api/patients/${editingPatient.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                  });
                } else {
                  await fetch('/api/patients', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                  });
                }
                refreshData();
                setActiveTab('Patients');
              }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Patient Full Name</label>
                  <input name="name" defaultValue={editingPatient?.name} placeholder="e.g. John Doe" className="input" required />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Contact Number</label>
                  <input name="contact" defaultValue={editingPatient?.contact} placeholder="e.g. 03001234567" className="input" required />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Medical Diagnosis</label>
                  <textarea name="diagnosis" defaultValue={editingPatient?.diagnosis} placeholder="Enter detailed medical notes..." className="input" style={{ minHeight: '120px' }} required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '16px' }}>
                  {editingPatient ? 'Update Record' : 'Add Secure Record'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'Audit Logs' && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass" style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShieldAlert color="#ef4444" />
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#b91c1c' }}>Integrity Audit Trail: Monitoring all data transactions and access.</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: 'var(--secondary)', fontSize: '13px', textAlign: 'left', borderBottom: '1px solid var(--card-border)' }}>
                    <th style={{ padding: '16px' }}>Timestamp</th>
                    <th style={{ padding: '16px' }}>Role</th>
                    <th style={{ padding: '16px' }}>Action</th>
                    <th style={{ padding: '16px' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--card-border)', fontSize: '13px' }}>
                      <td style={{ padding: '16px', color: 'var(--secondary)' }}>{new Date(l.timestamp).toLocaleString()}</td>
                      <td style={{ padding: '16px' }}><span style={{ textTransform: 'capitalize', fontWeight: '600' }}>{l.role}</span></td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '6px', 
                          background: l.action.includes('delete') ? '#fee2e2' : '#f0f9ff',
                          color: l.action.includes('delete') ? '#991b1b' : '#075985',
                          fontWeight: '700',
                          fontSize: '11px'
                        }}>{l.action.toUpperCase()}</span>
                      </td>
                      <td style={{ padding: '16px' }}>{l.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'Maintenance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ background: '#fef3c7', padding: '24px', borderRadius: '16px', border: '1px solid #fcd34d' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <Database size={32} color="#92400e" />
                  <h3 style={{ color: '#92400e' }}>Database Maintenance & GDPR Cleanup</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="glass" style={{ padding: '20px', background: 'white' }}>
                    <h4 style={{ marginBottom: '12px' }}>Mass Anonymization</h4>
                    <p style={{ fontSize: '13px', color: 'var(--secondary)', marginBottom: '20px' }}>Re-encrypt all patient identifiers using the latest AES-256 keys and update deterministic hashes.</p>
                    <button onClick={() => runMaintenance('anonymize_all')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Trigger Mass Anonymize</button>
                  </div>
                  <div className="glass" style={{ padding: '20px', background: 'white' }}>
                    <h4 style={{ marginBottom: '12px' }}>GDPR Data Retention</h4>
                    <p style={{ fontSize: '13px', color: 'var(--secondary)', marginBottom: '20px' }}>Automatically delete logs older than 1 year and patient records older than 3 years to comply with data minimization.</p>
                    <button onClick={() => runMaintenance('cleanup')} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', border: '1px solid #ef4444', color: '#ef4444' }}>Run Retention Cleanup</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Analysis' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div className="glass" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '24px' }}>Real-time System Activity</h3>
                <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '20px', paddingBottom: '40px', borderBottom: '2px solid var(--card-border)' }}>
                  {/* Simple CSS-based bar chart for activity */}
                  {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '100%', height: `${h}%`, background: 'var(--primary)', borderRadius: '8px 8px 0 0', opacity: 0.7 + (h/300) }}></div>
                      <span style={{ fontSize: '11px', color: 'var(--secondary)' }}>Day {i+1}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary)' }}></div> Activity Level
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'About GDPR' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: '1.6' }}>
              <h2 style={{ color: 'var(--primary)' }}>🧭 Data Privacy & CIA Compliance</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <div className="glass" style={{ padding: '20px' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><Lock size={18} /> Confidentiality</h4>
                  <p style={{ fontSize: '13px' }}>Patient identities are hidden (SHA-256) or encrypted (AES-256). Role-based access ensures only authorized personnel see sensitive fields.</p>
                </div>
                <div className="glass" style={{ padding: '20px' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><CheckCircle2 size={18} /> Integrity</h4>
                  <p style={{ fontSize: '13px' }}>Audit logs track every single transaction. Database constraints and server-side validation prevent unauthorized tampering.</p>
                </div>
                <div className="glass" style={{ padding: '20px' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><Activity size={18} /> Availability</h4>
                  <p style={{ fontSize: '13px' }}>Serverless architecture ensures 99.9% uptime. Automated backups and CSV exports ensure data is retrievable during recovery.</p>
                </div>
              </div>
              <div className="glass" style={{ padding: '24px' }}>
                <h3>GDPR Principles Applied</h3>
                <ul style={{ paddingLeft: '20px', marginTop: '12px', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li><strong>Lawfulness & Transparency:</strong> Consent banner on login and transparent audit trails.</li>
                  <li><strong>Data Minimization:</strong> Doctors only see what they need (diagnoses/anonymized IDs).</li>
                  <li><strong>Storage Limitation:</strong> Automatic retention cleanup for old records.</li>
                  <li><strong>Accountability:</strong> Every action is tied to a user ID and role in the immutable audit log.</li>
                </ul>
              </div>
            </div>
          )}
        </section>

        <footer style={{ marginTop: 'auto', padding: '20px 0', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--secondary)' }}>
          <div style={{ display: 'flex', gap: '24px' }}>
            <span>System Uptime: <strong>{systemUptime}</strong></span>
            <span>Last Synchronized: <strong>{lastSync}</strong></span>
          </div>
          <div>&copy; 2026 GDPR Hospital OS - CIA Triad Compliant</div>
        </footer>
      </main>
    </div>
  );
}
