import { useState } from 'react';
import { categories, dummyUsers } from '../data/dummyData';

const managers = dummyUsers.filter((u) => u.role === 'manager' || u.role === 'admin');

export default function ApprovalRuleForm({ onSave, initial = {} }) {
  const [form, setForm] = useState({
    name: '', category: '', flowType: 'sequential',
    isManagerApprover: false, approvers: [],
    minApprovalPercent: 100, specialApprover: '',
    ...initial,
  });

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleApprover = (id) => {
    setForm((f) => ({
      ...f,
      approvers: f.approvers.includes(id)
        ? f.approvers.filter((a) => a !== id)
        : [...f.approvers, id],
    }));
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="label">Rule Name <span className="text-red-500">*</span></label>
        <input name="name" value={form.name} onChange={change}
          className="input" placeholder="e.g. Travel Expense Rule" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Category</label>
          <select name="category" value={form.category} onChange={change} className="input">
            <option value="">All (Default / Catch-all)</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Flow Type</label>
          <select name="flowType" value={form.flowType} onChange={change} className="input">
            <option value="sequential">Sequential (one by one)</option>
            <option value="parallel">Parallel (all at once)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Approvers</label>
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
          {dummyUsers.filter((u) => u.role !== 'employee').map((u) => (
            <label key={u.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={form.approvers.includes(u.id)}
                onChange={() => toggleApprover(u.id)}
                className="w-4 h-4 text-blue-600 rounded" />
              <div>
                <p className="text-sm font-medium text-gray-700">{u.name}</p>
                <p className="text-xs text-gray-400 capitalize">{u.role}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3">
        <input type="checkbox" id="managerFirst" name="isManagerApprover"
          checked={form.isManagerApprover} onChange={change}
          className="w-4 h-4 text-blue-600 rounded" />
        <label htmlFor="managerFirst" className="text-sm text-gray-700 cursor-pointer">
          <span className="font-medium">Manager is first approver</span>
          <br /><span className="text-gray-500 text-xs">Employee's assigned manager will be added as step 1</span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Min Approval % (for parallel)</label>
          <input type="number" name="minApprovalPercent" value={form.minApprovalPercent}
            onChange={change} className="input" min="1" max="100" />
        </div>
        <div>
          <label className="label">Special Approver (override)</label>
          <select name="specialApprover" value={form.specialApprover} onChange={change} className="input">
            <option value="">None</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={() => onSave && onSave(form)} className="btn-primary flex-1">
          Save Rule
        </button>
      </div>
    </div>
  );
}
