import { LayoutDashboard, Users, ClipboardList, Receipt, ChevronRight } from 'lucide-react';

const adminMenu = [
  { id: 'dashboard',     label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'users',         label: 'Users',           icon: Users },
  { id: 'rules',         label: 'Approval Rules',  icon: ClipboardList },
  { id: 'expenses',      label: 'Expenses',        icon: Receipt },
];

const employeeMenu = [
  { id: 'dashboard',  label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'expenses',   label: 'My Expenses',  icon: Receipt },
];

const managerMenu = [
  { id: 'dashboard',  label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'approvals',  label: 'Approvals',    icon: ClipboardList },
  { id: 'expenses',   label: 'Team Expenses',icon: Receipt },
];

const menuMap = { admin: adminMenu, employee: employeeMenu, manager: managerMenu };

export default function Sidebar({ role = 'admin', active, onNavigate }) {
  const menu = menuMap[role] || adminMenu;
  return (
    <aside className="w-56 bg-white border-r border-gray-200 min-h-screen flex flex-col flex-shrink-0">
      <nav className="flex-1 py-4 px-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
          Menu
        </p>
        <ul className="space-y-1">
          {menu.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <button
                onClick={() => onNavigate(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                  active === id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={17} className={active === id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'} />
                <span className="flex-1 text-left">{label}</span>
                {active === id && <ChevronRight size={14} className="text-blue-400" />}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs font-semibold text-blue-700 capitalize">{role} Portal</p>
          <p className="text-xs text-blue-500 mt-0.5">ExpenseTrack v1.0</p>
        </div>
      </div>
    </aside>
  );
}
