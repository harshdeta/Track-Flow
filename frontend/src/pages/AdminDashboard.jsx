import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import SummaryCard from '../components/SummaryCard';
import UserTable from '../components/UserTable';
import ApprovalRuleForm from '../components/ApprovalRuleForm';
import ExpenseTable from '../components/ExpenseTable';
import Modal from '../components/Modal';
import ExpenseDetailsModal from '../components/ExpenseDetailsModal';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Plus, UserPlus, Loader2 } from 'lucide-react';
import { dummyUsers } from '../data/dummyData';

// ─── Add User Form ─────────────────────────────────────────────────────────────
function AddUserForm({ onSave, onCancel, managers }) {
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'employee', managerId:'', department:'' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async () => {
    if (!form.name || !form.email || !form.password) { setErr('Name, email and password are required.'); return; }
    setSaving(true);
    const result = await onSave(form);
    if (result?.error) setErr(result.error);
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      {err && <div className="text-red-600 bg-red-50 border border-red-200 text-sm px-3 py-2 rounded-lg">{err}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Full Name *</label>
          <input name="name" value={form.name} onChange={change} className="input" placeholder="John Smith" />
        </div>
        <div>
          <label className="label">Email *</label>
          <input name="email" type="email" value={form.email} onChange={change} className="input" placeholder="john@company.com" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Password *</label>
          <input name="password" type="password" value={form.password} onChange={change} className="input" placeholder="Min. 6 chars" />
        </div>
        <div>
          <label className="label">Department</label>
          <input name="department" value={form.department} onChange={change} className="input" placeholder="Engineering" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Role</label>
          <select name="role" value={form.role} onChange={change} className="input">
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
          </select>
        </div>
        {form.role === 'employee' && (
          <div>
            <label className="label">Assign Manager</label>
            <select name="managerId" value={form.managerId} onChange={change} className="input">
              <option value="">No manager</option>
              {managers.map((m) => <option key={m._id || m.id} value={m._id || m.id}>{m.name}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={submit} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {saving ? <><Loader2 size={14} className="animate-spin" />Creating...</> : 'Create User'}
        </button>
        <button onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAuth();
  const [active, setActive] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [rules, setRules] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [modal, setModal] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Load data when section changes
  useEffect(() => {
    const load = async () => {
      setLoadingData(true);
      try {
        if (active === 'dashboard' || active === 'expenses') {
          const r = await api.get('/expenses');
          setExpenses(r.data.expenses || []);
        }
        if (active === 'dashboard' || active === 'users') {
          const r = await api.get('/users');
          setUsers(r.data.users || []);
        }
        if (active === 'rules') {
          const r = await api.get('/approval-rules');
          setRules(r.data.rules || []);
        }
      } catch (e) { console.error(e); }
      finally { setLoadingData(false); }
    };
    load();
  }, [active]);

  const managers = users.filter((u) => u.role === 'manager' || u.role === 'admin');

  const handleAddUser = async (form) => {
    try {
      const r = await api.post('/users', form);
      setUsers((prev) => [...prev, r.data.user]);
      setModal(null);
      return {};
    } catch (e) {
      return { error: e.response?.data?.message || 'Failed to create user.' };
    }
  };

  const handleDeactivate = async (u) => {
    try {
      await api.delete(`/users/${u._id}`);
      setUsers((prev) => prev.map((x) => x._id === u._id ? { ...x, isActive: false } : x));
    } catch (e) { alert(e.response?.data?.message || 'Failed to deactivate.'); }
  };

  const handleSaveRule = async (form) => {
    try {
      const r = await api.post('/approval-rules', form);
      setRules((prev) => [...prev, r.data.rule]);
      setModal(null);
    } catch (e) { alert(e.response?.data?.message || 'Failed to save rule.'); }
  };

  const Loading = () => (
    <div className="flex items-center justify-center py-12">
      <Loader2 size={24} className="animate-spin text-blue-500" />
    </div>
  );

  // Normalize user for table (API returns isActive, table expects status string)
  const normalizedUsers = users.map((u) => ({
    ...u, id: u._id, status: u.isActive !== false ? 'Active' : 'Inactive',
    manager: u.manager?.name || '—', department: u.department || '—',
  }));

  const renderContent = () => {
    switch (active) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Admin Dashboard</h2>
              <p className="text-sm text-gray-500 mt-0.5">Welcome back, {user?.name}</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard label="Total Users"    value={users.length}   color="blue"   icon="👥" />
              <SummaryCard label="Total Expenses" value={expenses.length} color="gray"  icon="🧾" />
              <SummaryCard label="Pending Review" value={expenses.filter(e=>e.status==='pending').length} color="yellow" icon="⏳" />
              <SummaryCard label="Approved"       value={expenses.filter(e=>e.status==='approved').length} color="green" icon="✅" />
            </div>
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">Recent Expenses</h3>
              {loadingData ? <Loading /> : (
                <ExpenseTable expenses={expenses.slice(0,5).map(e=>({...e,id:e._id,category:e.category,status:e.status?.charAt(0).toUpperCase()+e.status?.slice(1),employee:e.user?.name}))} showEmployee onView={setSelectedExpense} />
              )}
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">User Management</h2>
                <p className="text-sm text-gray-500 mt-0.5">{users.length} users in your company</p>
              </div>
              <button onClick={() => setModal({ type:'addUser' })} className="btn-primary flex items-center gap-2">
                <UserPlus size={16} /> Add User
              </button>
            </div>
            <div className="card p-0 overflow-hidden">
              {loadingData ? <Loading /> : <UserTable users={normalizedUsers} onEdit={() => {}} onDeactivate={handleDeactivate} />}
            </div>
          </div>
        );

      case 'rules':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Approval Rules</h2>
                <p className="text-sm text-gray-500 mt-0.5">Configure your approval workflow</p>
              </div>
              <button onClick={() => setModal({ type:'addRule' })} className="btn-primary flex items-center gap-2">
                <Plus size={16} /> New Rule
              </button>
            </div>
            {loadingData ? <Loading /> : (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div key={rule._id} className="card">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800">{rule.name}</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{rule.category || 'All Categories'}</span>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{rule.flowType}</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Min: {rule.minApprovalPercent || 100}%</span>
                        </div>
                      </div>
                      <button onClick={async () => { await api.delete(`/approval-rules/${rule._id}`); setRules(r=>r.filter(x=>x._id!==rule._id)); }}
                        className="text-xs text-red-500 hover:underline">Delete</button>
                    </div>
                  </div>
                ))}
                {rules.length === 0 && <div className="card text-center text-gray-400 py-10">No rules yet.</div>}
              </div>
            )}
          </div>
        );

      case 'expenses':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">All Expenses</h2>
              <p className="text-sm text-gray-500 mt-0.5">Company-wide expense activity</p>
            </div>
            <div className="card p-0 overflow-hidden">
              {loadingData ? <Loading /> : (
                <ExpenseTable
                  expenses={expenses.map(e=>({...e,id:e._id,status:e.status?.charAt(0).toUpperCase()+e.status?.slice(1),employee:e.user?.name}))}
                  showEmployee onView={setSelectedExpense} />
              )}
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar role="admin" active={active} onNavigate={setActive} />
        <main className="flex-1 overflow-y-auto p-6">{renderContent()}</main>
      </div>

      <Modal isOpen={modal?.type==='addUser'} onClose={() => setModal(null)} title="Add New User">
        <AddUserForm onSave={handleAddUser} onCancel={() => setModal(null)} managers={managers} />
      </Modal>
      <Modal isOpen={modal?.type==='addRule'||modal?.type==='editRule'} onClose={() => setModal(null)}
        title={modal?.type==='editRule' ? 'Edit Rule' : 'Create Approval Rule'} size="lg">
        <ApprovalRuleForm onSave={handleSaveRule} initial={modal?.data} />
      </Modal>
      <Modal isOpen={!!selectedExpense} onClose={() => setSelectedExpense(null)} title="Expense Details" size="lg">
        <ExpenseDetailsModal expense={selectedExpense} />
      </Modal>
    </div>
  );
}
