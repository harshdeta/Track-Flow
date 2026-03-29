export default function SummaryCard({ label, value, sub, color = 'blue', icon }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   val: 'text-blue-900',  border: 'border-blue-100' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', val: 'text-yellow-900',border: 'border-yellow-100' },
    green:  { bg: 'bg-green-50',  text: 'text-green-700',  val: 'text-green-900', border: 'border-green-100' },
    red:    { bg: 'bg-red-50',    text: 'text-red-700',    val: 'text-red-900',   border: 'border-red-100' },
    gray:   { bg: 'bg-gray-50',   text: 'text-gray-600',   val: 'text-gray-800',  border: 'border-gray-200' },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className={`bg-white rounded-xl border ${c.border} p-5 flex items-start gap-4`}>
      {icon && (
        <div className={`${c.bg} p-3 rounded-lg flex-shrink-0`}>
          <span className={`${c.text} text-xl`}>{icon}</span>
        </div>
      )}
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${c.val}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}
