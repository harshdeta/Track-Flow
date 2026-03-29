import { useState } from 'react';
import { categories, currencies } from '../data/dummyData';

const initialForm = {
  description: '', category: '', date: '', amount: '',
  currency: 'INR', paidBy: 'employee', remarks: '', receipt: null,
};

export default function ExpenseForm({ onSave, onSubmit, onCancel }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const change = (e) => {
    const { name, value, files } = e.target;
    setForm((f) => ({ ...f, [name]: files ? files[0] : value }));
    setErrors((er) => ({ ...er, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.description.trim()) e.description = 'Description is required.';
    if (!form.category)          e.category    = 'Category is required.';
    if (!form.date)              e.date        = 'Date is required.';
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0)
                                 e.amount      = 'Enter a valid amount.';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave && onSave({ ...form, status: 'Draft' });
    setForm(initialForm);
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSubmit && onSubmit({ ...form, status: 'Pending' });
    setForm(initialForm);
  };

  const Field = ({ label, name, type = 'text', children, required }) => (
    <div>
      <label className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children || <input type={type} name={name} value={form[name]} onChange={change} className="input" />}
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      <Field label="Description" name="description" required>
        <textarea name="description" value={form.description} onChange={change} rows={2}
          className="input resize-none" placeholder="What was this expense for?" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Category" name="category" required>
          <select name="category" value={form.category} onChange={change} className="input">
            <option value="">Select category</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Date" name="date" type="date" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Amount" name="amount" type="number" required>
          <input type="number" name="amount" value={form.amount} onChange={change}
            className="input" placeholder="0.00" min="0" step="0.01" />
        </Field>
        <Field label="Currency" name="currency">
          <select name="currency" value={form.currency} onChange={change} className="input">
            {currencies.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Paid By" name="paidBy">
        <select name="paidBy" value={form.paidBy} onChange={change} className="input">
          <option value="employee">Employee (Out-of-pocket)</option>
          <option value="company_card">Company Card</option>
        </select>
      </Field>

      <Field label="Receipt (optional)" name="receipt">
        <input type="file" name="receipt" onChange={change} accept=".jpg,.jpeg,.png,.pdf"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-300 rounded-lg cursor-pointer" />
      </Field>

      <Field label="Remarks (optional)" name="remarks">
        <textarea name="remarks" value={form.remarks} onChange={change} rows={2}
          className="input resize-none" placeholder="Any additional notes..." />
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <button onClick={handleSave} className="btn-secondary flex-1">Save as Draft</button>
        <button onClick={handleSubmit} className="btn-primary flex-1">Submit for Approval</button>
        {onCancel && <button onClick={onCancel} className="btn-secondary">Cancel</button>}
      </div>
    </div>
  );
}
