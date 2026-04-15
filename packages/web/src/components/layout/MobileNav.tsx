import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BedDouble, Sparkles, Wrench, Users, Calendar,
  BarChart3, ClipboardCheck, Settings, UserCog, MapPin, ConciergeBell,
  Cpu, ClipboardList, LogIn, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { MOBILE_NAV_CONFIG } from '@/utils/constants';
import { cn } from '@/utils/cn';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, BedDouble, Sparkles, Wrench, Users, Calendar,
  BarChart3, ClipboardCheck, Settings, UserCog, MapPin, ConciergeBell,
  Cpu, ClipboardList, LogIn, AlertTriangle,
};

export function MobileNav() {
  const { user } = useAuth();
  if (!user) return null;

  const items = MOBILE_NAV_CONFIG[user.role] || MOBILE_NAV_CONFIG.gm;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white lg:hidden">
      <div className="flex items-stretch justify-around">
        {items.map(item => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          return (
            <NavLink
              key={item.path + item.label}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
                  isActive ? 'text-blue-600' : 'text-gray-500'
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
      {/* Safe area for phones with bottom bars */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
