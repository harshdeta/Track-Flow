import StatusBadge from './StatusBadge';
import { dummyApprovalHistory } from '../data/dummyData';

export default function ExpenseDetailsModal({ expense }) {
  if (!expense) return null;

  return (
    <div className="space-y-5">
      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {[
          { label: 'Description', value: expense.description },
          { label: 'Category',    value: expense.category },
          { label: 'Amount',      value: `${expense.currency} ${expense.amount?.toLocaleString()}` },
          { label: 'Date',        value: expense.date },
          { label: 'Paid By',     value: expense.paidBy || '—' },
          { label: 'Status',      value: null, badge: true },
        ].map(({ label, value, badge }) => (
          <div key={label}>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
            {badge
              ? <StatusBadge status={expense.status} />
              : <p className="text-sm font-medium text-gray-800 mt-0.5">{value || '—'}</p>
            }
          </div>
        ))}
      </div>

      {expense.remarks && (
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Remarks</p>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{expense.remarks}</p>
        </div>
      )}

      {/* Receipt Placeholder */}
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Receipt</p>
        <div className="border-2 border-dashed border-gray-200 rounded-xl h-28 flex items-center justify-center bg-gray-50">
          {expense.receiptUrl
            ? <img src={expense.receiptUrl} alt="Receipt" className="max-h-full rounded" />
            : <div className="text-center text-gray-400">
                <p className="text-2xl">📄</p>
                <p className="text-xs mt-1">No receipt uploaded</p>
              </div>
          }
        </div>
      </div>

      {/* Approval History */}
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Approval History</p>
        {dummyApprovalHistory.length === 0
          ? <p className="text-sm text-gray-400 italic">No approval activity yet.</p>
          : (
            <div className="space-y-2">
              {dummyApprovalHistory.map((log, i) => (
                <div key={i} className="flex items-start gap-3 border border-gray-100 rounded-lg p-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5
                    ${log.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {log.status === 'Approved' ? '✓' : '✗'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-800">
                        Step {log.step}: {log.approver}
                        <span className="text-xs text-gray-400 ml-1 font-normal">({log.role})</span>
                      </p>
                      <p className="text-xs text-gray-400">{log.date}</p>
                    </div>
                    {log.comment && <p className="text-xs text-gray-500 mt-0.5">"{log.comment}"</p>}
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}
