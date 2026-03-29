import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import SummaryCard from '../components/SummaryCard';
import ApprovalCard from '../components/ApprovalCard';
import ExpenseTable from '../components/ExpenseTable';
import Modal from '../components/Modal';
import ExpenseDetailsModal from '../components/ExpenseDetailsModal';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Loader2 } from 'lucide-react';

// ─── Approve / Reject Comment Modal ───────────────────────────────────────────
function CommentModal({ isOpen, onClose, onConfirm, action, loading }) {
  const [comment, setComment] = useState('');
  return (
    <Modal isOpen={isOpen} onClose={onClose}
      title={action === 'approve' ? '✅ Confirm Approval' : '❌ Confirm Rejection'} size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {action === 'approve'
            ? 'Add an optional comment before approving.'
            : 'Please provide a reason for rejection (visible to the employee).'}
        </p>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)}
          rows={3} className="input resize-none"
          placeholder={action === 'approve' ? 'Looks good! (optional)' : 'Missing receipt...'} />
        <div className="flex gap-3">
          <button
            onClick={() => { onConfirm(comment); setComment(''); }}
            disabled={loading}
            className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60 ${
              action === 'approve' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-500 text-white hover:bg-red-600'
            }`}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            {action === 'approve' ? 'Approve' : 'Reject'}
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </Modal>
  );
}

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [active, setActive]               = useState('dashboard');
  const [approvals, setApprovals]         = useState([]);
  const [teamExpenses, setTeamExpenses]   = useState([]);
  const [loadingData, setLoadingData]     = useState(false);
  const [savingAction, setSavingAction]   = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [actionModal, setActionModal]     = useState(null); // { action, expense }

  const fetchPending = async () => {
    setLoadingData(true);
    try {
      const r = await api.get('/approvals/pending');
      setApprovals(r.data.expenses || []);
    } catch (e) { console.error(e); }
    finally { setLoadingData(false); }
  };

  const fetchTeamExpenses = async () => {
    setLoadingData(true);
    try {
      const r = await api.get('/expenses');
      setTeamExpenses(r.data.expenses || []);
    } catch (e) { console.error(e); }
    finally { setLoadingData(false); }
  };

  useEffect(() => {
    fetchPending();
    fetchTeamExpenses();
  }, []);

  const handleDecision = async (comment) => {
    const { action, expense } = actionModal;
    setSavingAction(true);
    try {
      const endpoint = `/approvals/${expense._id}/${action}`;
      await api.post(endpoint, { comment });
      // Remove from pending list
      setApprovals((prev) => prev.filter((a) => a._id !== expense._id));
      setActionModal(null);
    } catch (e) {
      alert(e.response?.data?.message || `Failed to ${action} expense.`);
    } finally {
      setSavingAction(false);
    }
  };

  const normalize = (e) => ({
    ...e, id: e._id,
    status: e.status?.charAt(0).toUpperCase() + e.status?.slice(1),
    employee: e.user?.name || '—',
  });

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
              <h2 className="text-xl font-bold text-gray-800">Manager Dashboard</h2>
              <p className="text-sm text-gray-500 mt-0.5">Welcome back, {user?.name}</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <SummaryCard label="Pending Approvals" value={approvals.length} color="yellow" icon="⏳" sub="Requires your action" />
              <SummaryCard label="Team Expenses"     value={teamExpenses.length} color="blue" icon="🧾" sub="All submissions" />
              <SummaryCard label="Approved This Month" value={teamExpenses.filter(e=>e.status==='approved').length} color="green" icon="✅" />
            </div>
            {approvals.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">Pending Approvals ({approvals.length})</h3>
                  <button onClick={() => setActive('approvals')} className="text-blue-600 text-sm hover:underline">View all →</button>
                </div>
                {loadingData ? <Loading /> : (
                  <ApprovalCard
                    approvals={approvals.map(normalize)}
                    onView={(e) => setSelectedExpense(approvals.find(a=>a._id===e.id)||e)}
                    onApprove={(e) => setActionModal({ action:'approve', expense: approvals.find(a=>a._id===e.id)||e })}
                    onReject={(e)  => setActionModal({ action:'reject',  expense: approvals.find(a=>a._id===e.id)||e })}
                  />
                )}
              </div>
            )}
            {approvals.length === 0 && !loadingData && (
              <div className="card text-center py-10">
                <p className="text-2xl mb-2">✅</p>
                <p className="text-gray-500 text-sm">All caught up! No pending approvals.</p>
              </div>
            )}
          </div>
        );

      case 'approvals':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Pending Approvals</h2>
              <p className="text-sm text-gray-500 mt-0.5">{approvals.length} awaiting your decision</p>
            </div>
            <div className="card p-0 overflow-hidden">
              {loadingData ? <Loading /> : (
                <ApprovalCard
                  approvals={approvals.map(normalize)}
                  onView={(e) => setSelectedExpense(approvals.find(a=>a._id===e.id)||e)}
                  onApprove={(e) => setActionModal({ action:'approve', expense: approvals.find(a=>a._id===e.id)||e })}
                  onReject={(e)  => setActionModal({ action:'reject',  expense: approvals.find(a=>a._id===e.id)||e })}
                />
              )}
            </div>
          </div>
        );

      case 'expenses':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Team Expenses</h2>
              <p className="text-sm text-gray-500 mt-0.5">All expenses from your team</p>
            </div>
            <div className="card p-0 overflow-hidden">
              {loadingData ? <Loading /> : (
                <ExpenseTable expenses={teamExpenses.map(normalize)} showEmployee onView={(e) => setSelectedExpense(teamExpenses.find(t=>t._id===e.id)||e)} />
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
        <Sidebar role="manager" active={active} onNavigate={setActive} />
        <main className="flex-1 overflow-y-auto p-6">{renderContent()}</main>
      </div>

      <Modal isOpen={!!selectedExpense} onClose={() => setSelectedExpense(null)} title="Expense Details" size="lg">
        <ExpenseDetailsModal expense={selectedExpense} />
      </Modal>
      <CommentModal
        isOpen={!!actionModal}
        onClose={() => setActionModal(null)}
        onConfirm={handleDecision}
        action={actionModal?.action}
        loading={savingAction}
      />
    </div>
  );
}
