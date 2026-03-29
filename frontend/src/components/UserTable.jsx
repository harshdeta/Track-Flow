import StatusBadge from './StatusBadge';
import { Pencil, Trash2 } from 'lucide-react';

export default function UserTable({ users, onEdit, onDeactivate }) {
  if (!users || users.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-4xl mb-2">👥</p>
        <p className="text-sm">No users found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="table-th">Name</th>
            <th className="table-th">Email</th>
            <th className="table-th">Role</th>
            <th className="table-th">Manager</th>
            <th className="table-th">Department</th>
            <th className="table-th">Status</th>
            <th className="table-th">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="table-tr">
              <td className="table-td">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <span className="font-medium">{user.name}</span>
                </div>
              </td>
              <td className="table-td text-gray-500">{user.email}</td>
              <td className="table-td">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize
                  ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                    user.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'}`}>
                  {user.role}
                </span>
              </td>
              <td className="table-td text-gray-500">{user.manager}</td>
              <td className="table-td text-gray-500">{user.department}</td>
              <td className="table-td"><StatusBadge status={user.status} /></td>
              <td className="table-td">
                <div className="flex items-center gap-2">
                  <button onClick={() => onEdit && onEdit(user)} className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => onDeactivate && onDeactivate(user)} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded">
                    <Trash2 size={14} />
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
