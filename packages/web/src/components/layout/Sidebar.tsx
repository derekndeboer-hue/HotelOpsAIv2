import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BedDouble, Sparkles, Wrench, Users, Calendar,
  BarChart3, ClipboardCheck, Settings, UserCog, MapPin, ConciergeBell,
  Cpu, ClipboardList, LogIn, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { NAV_CONFIG } from '@/utils/constants';
import { cn } from '@/utils/cn';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, BedDouble, Sparkles, Wrench, Users, Calendar,
  BarChart3, ClipboardCheck, Settings, UserCog, MapPin, ConciergeBell,
  Cpu, ClipboardList, LogIn, AlertTriangle,
};

export function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-gray-200 lg:bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
          H
        </div>
        <span className="text-lg font-bold text-gray-900">Hotel Ops</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_CONFIG.map(group => {
          const visibleItems = group.items.filter(
            item => user && item.roles.includes(user.role)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} className="mb-6">
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map(item => {
                  const Icon = iconMap[item.icon] || LayoutDashboard;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/'}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        )
                      }
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
