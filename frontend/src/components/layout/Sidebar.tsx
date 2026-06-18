import { NavLink } from 'react-router-dom';
import { SIDEBAR_SECTION, NAV_ITEMS } from '../../data/labels';

const icons: Record<string, string> = {
  queue: '📋',
  agent: '🤖',
  review: '✓',
  metrics: '📈',
};

export function Sidebar() {
  return (
    <aside className="w-56 bg-white border-r border-gray-200 min-h-[calc(100vh-49px)] flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-mayo-navy flex items-center justify-center text-white text-xs font-bold">
            MC
          </div>
          <span className="text-xs text-gray-500 font-medium">Mayo Clinic</span>
        </div>
        <input
          type="text"
          placeholder="Search patient..."
          className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md bg-gray-50"
          readOnly
        />
      </div>
      <nav className="p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          {SIDEBAR_SECTION}
        </p>
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'bg-mayo-light-blue text-mayo-navy font-medium border-l-4 border-mayo-navy'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <span>{icons[item.icon]}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
