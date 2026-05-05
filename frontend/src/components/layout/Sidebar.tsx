import { NavLink } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import Logo from "./Logo";

const links = [
  { to: "/", label: "Dashboard", icon: "⊞" },
  { to: "/clients", label: "Clients", icon: "👤" },
  { to: "/exercises", label: "Exercises", icon: "🏋️" },
  { to: "/workout-plans", label: "Workout Plans", icon: "📋" },
  { to: "/schedule", label: "Schedule", icon: "📅" },
  { to: "/sessions", label: "Sessions", icon: "⏱️" },
  { to: "/groups", label: "Groups", icon: "👥" },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  return (
    <aside className="flex h-full w-56 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center gap-2 p-5 text-xl font-bold text-slate-900">
        <Logo size={28} />
        Coachbase
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-slate-100 font-medium text-slate-900"
                  : "text-gray-600 hover:bg-gray-100"
              }`
            }
          >
            <span>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 pb-2">
        <NavLink
          to="/settings"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive
                ? "bg-indigo-50 font-medium text-indigo-700"
                : "text-gray-600 hover:bg-gray-100"
            }`
          }
        >
          <span>⚙</span>
          Settings
        </NavLink>
      </div>
      <div className="p-4">
        <button
          onClick={() => signOut(auth)}
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-100"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
