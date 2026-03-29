const statusConfig = {
  Approved: { bg: 'bg-green-100', text: 'text-green-700' },
  Pending:  { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  Rejected: { bg: 'bg-red-100', text: 'text-red-600' },
  Draft:    { bg: 'bg-gray-100', text: 'text-gray-600' },
  Active:   { bg: 'bg-green-100', text: 'text-green-700' },
  Inactive: { bg: 'bg-red-100', text: 'text-red-600' },
};

export default function StatusBadge({ status }) {
  const cfg = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      {status}
    </span>
  );
}
