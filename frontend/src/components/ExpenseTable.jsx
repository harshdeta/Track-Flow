import StatusBadge from './StatusBadge';

export default function ExpenseTable({ expenses, onView, showEmployee = false }) {
  if (!expenses || expenses.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-4xl mb-2">🧾</p>
        <p className="text-sm">No expenses found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {showEmployee && <th className="table-th">Employee</th>}
            <th className="table-th">Description</th>
            <th className="table-th">Category</th>
            <th className="table-th">Date</th>
            <th className="table-th">Amount</th>
            <th className="table-th">Status</th>
            <th className="table-th">Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((exp) => (
            <tr key={exp.id} className="table-tr">
              {showEmployee && <td className="table-td font-medium">{exp.employee}</td>}
              <td className="table-td font-medium max-w-48 truncate">{exp.description}</td>
              <td className="table-td">
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                  {exp.category}
                </span>
              </td>
              <td className="table-td text-gray-500">{exp.date}</td>
              <td className="table-td font-semibold">
                {exp.currency} {exp.amount.toLocaleString()}
              </td>
              <td className="table-td">
                <StatusBadge status={exp.status} />
              </td>
              <td className="table-td">
                <button
                  onClick={() => onView && onView(exp)}
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium hover:underline"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
