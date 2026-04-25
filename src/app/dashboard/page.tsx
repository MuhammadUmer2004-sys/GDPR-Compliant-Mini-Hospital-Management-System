'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, PlusCircle, ShieldCheck, ListFilter, 
  Download, BarChart3, Info, LogOut, Search,
  Activity, Clock, User
} from 'lucide-react';

export default function DashboardPage() {
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Patients');
  const [patients, setPatients] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchSession();
  }, []);

  useEffect(() => {
    if (session) {
      fetchPatients();
      if (session.role === 'admin') fetchLogs();
    }
  }, [session]);

  const fetchSession = async () => {
    const res = await fetch('/api/auth/me'); // I'll create this route
    const data = await res.json();
    if (data.session) {
      setSession(data.session);
    } else {
      router.push('/login');
    }
    setLoading(false);
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

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyItems: 'center' }}>Loading...</div>;

  const tabs = [
    { name: 'Patients', icon: <Users size={18} /> },
    { name: 'Add/Edit', icon: <PlusCircle size={18} /> },
    { name: 'Anonymize', icon: <ShieldCheck size={18} /> },
    { name: 'Audit Logs', icon: <ListFilter size={18} />, adminOnly: true },
    { name: 'Export', icon: <Download size={18} /> },
    { name: 'Activity', icon: <BarChart3 size={18} /> },
    { name: 'About', icon: <Info size={18} /> },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      {/* Sidebar */}
      <aside className="glass" style={{ 
        width: '260px', 
        padding: '24px', 
        margin: '16px', 
        display: 'flex', 
        flexDirection: 'column',
        gap: '32px'
      }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={24} /> Dashboard
          </h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tabs.map((tab) => {
            if (tab.adminOnly && session?.role !== 'admin') return null;
            return (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`btn ${activeTab === tab.name ? 'btn-primary' : 'btn-ghost'}`}
                style={{ justifyContent: 'flex-start', width: '100%' }}
              >
                {tab.icon} {tab.name}
              </button>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass" style={{ padding: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <User size={14} /> <strong>{session?.username}</strong>
            </div>
            <div style={{ color: 'var(--secondary)', textTransform: 'capitalize' }}>{session?.role}</div>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost" style={{ color: '#ef4444', justifyContent: 'flex-start' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800' }}>{activeTab}</h1>
            <p style={{ color: 'var(--secondary)' }}>Manage your hospital data securely</p>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div className="glass" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <Clock size={16} color="var(--primary)" />
              <span>System Uptime: 2h 45m</span>
            </div>
          </div>
        </header>

        <section className="glass animate-fade-in" style={{ padding: '24px', flex: 1 }}>
          {activeTab === 'Patients' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
               <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                    <th style={{ padding: '12px' }}>ID</th>
                    {session?.role === 'admin' && <th style={{ padding: '12px' }}>Name</th>}
                    {session?.role === 'doctor' && <th style={{ padding: '12px' }}>Anon Name</th>}
                    <th style={{ padding: '12px' }}>Diagnosis</th>
                    <th style={{ padding: '12px' }}>Date Added</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                      <td style={{ padding: '12px' }}>{p.id}</td>
                      {session?.role === 'admin' && <td style={{ padding: '12px' }}>{p.name}</td>}
                      {session?.role === 'doctor' && <td style={{ padding: '12px' }}>{p.anonymizedName}</td>}
                      <td style={{ padding: '12px' }}>{p.diagnosis}</td>
                      <td style={{ padding: '12px' }}>{new Date(p.dateAdded).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'Add/Edit' && (
            <div style={{ maxWidth: '600px' }}>
              <h3 style={{ marginBottom: '20px' }}>Add New Patient</h3>
              <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                await fetch('/api/patients', {
                  method: 'POST',
                  body: JSON.stringify(Object.fromEntries(formData)),
                });
                fetchPatients();
                setActiveTab('Patients');
              }}>
                <input name="name" placeholder="Full Name" className="input" required />
                <input name="contact" placeholder="Contact Number" className="input" required />
                <textarea name="diagnosis" placeholder="Diagnosis" className="input" style={{ minHeight: '100px' }} required />
                <button type="submit" className="btn btn-primary">Save Patient Record</button>
              </form>
            </div>
          )}

          {activeTab === 'Audit Logs' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <th style={{ padding: '12px' }}>Timestamp</th>
                  <th style={{ padding: '12px' }}>User</th>
                  <th style={{ padding: '12px' }}>Action</th>
                  <th style={{ padding: '12px' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid var(--card-border)', fontSize: '14px' }}>
                    <td style={{ padding: '12px' }}>{new Date(l.timestamp).toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>{l.role}</td>
                    <td style={{ padding: '12px' }}>{l.action}</td>
                    <td style={{ padding: '12px' }}>{l.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {/* Other tabs omitted for brevity, can be expanded */}
          {['Anonymize', 'Export', 'Activity', 'About'].includes(activeTab) && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Info size={48} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
              <h3>{activeTab} Section</h3>
              <p style={{ color: 'var(--secondary)' }}>This feature is currently being integrated into the new architecture.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
