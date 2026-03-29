import StatusBadge from './StatusBadge';
import { Check, X, Eye } from 'lucide-react';

export default function ApprovalCard({ approvals, onApprove, onReject, onView }) {
  if (!approvals || approvals.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-4xl mb-2">✅</p>
        <p className="text-sm">No pending approvals. All caught up!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="table-th">Employee</th>
            <th className="table-th">Category</th>
            <th className="table-th">Description</th>
            <th className="table-th">Date</th>
            <th className="table-th">Amount</th>
            <th className="table-th">Status</th>
            <th className="table-th">Actions</th>
          </tr>
        </thead>
        <tbody>
          {approvals.map((item) => (
            <tr key={item.id} className="table-tr">
              <td className="table-td">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold">
                    {item.employee.charAt(0)}
                  </div>
                  <span className="font-medium">{item.employee}</span>
                </div>
              </td>
              <td className="table-td">
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{item.category}</span>
              </td>
              <td className="table-td max-w-40 truncate">{item.description}</td>
              <td className="table-td text-gray-500">{item.date}</td>
              <td className="table-td font-semibold">{item.currency} {item.amount.toLocaleString()}</td>
              <td className="table-td"><StatusBadge status={item.status} /></td>
              <td className="table-td">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => onView && onView(item)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View">
                    <Eye size={14} />
                  </button>
                  <button onClick={() => onApprove && onApprove(item)}
                    className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors" title="Approve">
                    <Check size={14} />
                  </button>
                  <button onClick={() => onReject && onReject(item)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Reject">
                    <X size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
