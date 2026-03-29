import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import SummaryCard from '../components/SummaryCard';
import ExpenseTable from '../components/ExpenseTable';
import ExpenseForm from '../components/ExpenseForm';
import Modal from '../components/Modal';
import ExpenseDetailsModal from '../components/ExpenseDetailsModal';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Plus, Loader2 } from 'lucide-react';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [active, setActive]               = useState('dashboard');
  const [expenses, setExpenses]           = useState([]);
  const [loadingData, setLoadingData]     = useState(false);
  const [showForm, setShowForm]           = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const fetchExpenses = async () => {
    setLoadingData(true);
    try {
      const r = await api.get('/expenses');
      setExpenses(r.data.expenses || []);
    } catch (e) { console.error(e); }
    finally { setLoadingData(false); }
  };

  useEffect(() => { fetchExpenses(); }, []);

  // Normalize status to title-case for badges
  const normalize = (e) => ({
    ...e, id: e._id,
    status: e.status?.charAt(0).toUpperCase() + e.status?.slice(1),
    employee: e.user?.name || user?.name,
  });

  const summary = {
    total:    expenses.length,
    pending:  expenses.filter((e) => e.status === 'pending').length,
    approved: expenses.filter((e) => e.status === 'approved').length,
    rejected: expenses.filter((e) => e.status === 'rejected').length,
    draft:    expenses.filter((e) => e.status === 'draft').length,
  };

  const handleSave = async (form) => {
    try {
      form.submitImmediately = false;
      const r = await api.post('/expenses', form);
      setExpenses((prev) => [r.data.expense, ...prev]);
      setShowForm(false);
    } catch (e) { alert(e.response?.data?.message || 'Failed to save expense.'); }
  };

  const handleSubmit = async (form) => {
    try {
      form.submitImmediately = true;
      const r = await api.post('/expenses', form);
      setExpenses((prev) => [r.data.expense, ...prev]);
      setShowForm(false);
    } catch (e) { alert(e.response?.data?.message || 'Failed to submit expense.'); }
  };

  const Loading = () => (
    <div className="flex items-center justify-center py-12">
      <Loader2 size={24} className="animate-spin text-blue-500" />
    </div>
  );

  const renderContent = () => {
    switch (active) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">My Dashboard</h2>
              <p className="text-sm text-gray-500 mt-0.5">Welcome back, {user?.name}</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard label="Total" value={summary.total} color="blue" icon="🧾"
                sub={`${summary.draft} draft`} />
              <SummaryCard label="Pending"  value={summary.pending}  color="yellow" icon="⏳" sub="Awaiting approval" />
              <SummaryCard label="Approved" value={summary.approved} color="green"  icon="✅" sub="Fully approved" />
              <SummaryCard label="Rejected" value={summary.rejected} color="red"    icon="❌" sub="Needs attention" />
            </div>
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Recent Expenses</h3>
                <button onClick={() => setActive('expenses')} className="text-blue-600 text-sm hover:underline">View all →</button>
              </div>
              {loadingData ? <Loading /> : <ExpenseTable expenses={expenses.slice(0,4).map(normalize)} onView={setSelectedExpense} />}
            </div>
          </div>
        );

      case 'expenses':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">My Expenses</h2>
                <p className="text-sm text-gray-500 mt-0.5">{summary.total} total submissions</p>
              </div>
              <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
                <Plus size={16} /> New Expense
              </button>
            </div>
            <div className="card p-0 overflow-hidden">
              {loadingData ? <Loading /> : <ExpenseTable expenses={expenses.map(normalize)} onView={setSelectedExpense} />}
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
        <Sidebar role="employee" active={active} onNavigate={setActive} />
        <main className="flex-1 overflow-y-auto p-6">{renderContent()}</main>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Create New Expense" size="lg">
        <ExpenseForm onSave={handleSave} onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
      </Modal>
      <Modal isOpen={!!selectedExpense} onClose={() => setSelectedExpense(null)} title="Expense Details" size="lg">
        <ExpenseDetailsModal expense={selectedExpense} />
      </Modal>
    </div>
  );
}
