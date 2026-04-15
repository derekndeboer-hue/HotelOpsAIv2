import type { RoomStatus, WOPriority, Role } from '@/types';

export const ROOM_STATUS_COLORS: Record<RoomStatus, { bg: string; text: string; dot: string }> = {
  occupied:            { bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-500' },
  vacant_dirty:        { bg: 'bg-red-100',    text: 'text-red-800',    dot: 'bg-red-500' },
  cleaning_in_progress:{ bg: 'bg-amber-100',  text: 'text-amber-800',  dot: 'bg-amber-500' },
  vacant_clean:        { bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500' },
  inspected:           { bg: 'bg-emerald-100',text: 'text-emerald-800',dot: 'bg-emerald-500' },
  ready:               { bg: 'bg-teal-100',   text: 'text-teal-800',   dot: 'bg-teal-500' },
  out_of_order:        { bg: 'bg-gray-200',   text: 'text-gray-700',   dot: 'bg-gray-500' },
  out_of_service:      { bg: 'bg-gray-200',   text: 'text-gray-600',   dot: 'bg-gray-400' },
  do_not_disturb:      { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500' },
  checkout_pending:    { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
};

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  occupied:             'Occupied',
  vacant_dirty:         'Vacant Dirty',
  cleaning_in_progress: 'Cleaning',
  vacant_clean:         'Vacant Clean',
  inspected:            'Inspected',
  ready:                'Ready',
  out_of_order:         'Out of Order',
  out_of_service:       'Out of Service',
  do_not_disturb:       'DND',
  checkout_pending:     'Checkout Pending',
};

export const PRIORITY_COLORS: Record<WOPriority, { bg: string; text: string; border: string }> = {
  urgent: { bg: 'bg-red-600',    text: 'text-white',      border: 'border-red-600' },
  high:   { bg: 'bg-orange-500', text: 'text-white',      border: 'border-orange-500' },
  medium: { bg: 'bg-amber-400',  text: 'text-amber-900',  border: 'border-amber-400' },
  low:    { bg: 'bg-blue-200',   text: 'text-blue-800',   border: 'border-blue-200' },
};

export const ROLE_DISPLAY_NAMES: Record<Role, string> = {
  gm:                    'General Manager',
  front_desk:            'Front Desk',
  housekeeping_manager:  'Housekeeping Manager',
  housekeeper:           'Housekeeper',
  maintenance_manager:   'Maintenance Manager',
  technician:            'Technician',
  concierge:             'Concierge',
  admin:                 'Administrator',
};

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles: Role[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const ALL_ROLES: Role[] = ['gm', 'front_desk', 'housekeeping_manager', 'housekeeper', 'maintenance_manager', 'technician', 'concierge', 'admin'];
const MANAGEMENT: Role[] = ['gm', 'admin'];
const HK_ROLES: Role[] = ['gm', 'admin', 'housekeeping_manager', 'housekeeper'];
const MAINT_ROLES: Role[] = ['gm', 'admin', 'maintenance_manager', 'technician'];
const FD_ROLES: Role[] = ['gm', 'admin', 'front_desk', 'concierge'];

export const NAV_CONFIG: NavGroup[] = [
  {
    label: 'Operations',
    items: [
      { label: 'Dashboard',    path: '/',             icon: 'LayoutDashboard', roles: ALL_ROLES },
      { label: 'Room Board',   path: '/rooms',        icon: 'BedDouble',       roles: ALL_ROLES },
      { label: 'Housekeeping', path: '/housekeeping',  icon: 'Sparkles',        roles: HK_ROLES },
      { label: 'Maintenance',  path: '/maintenance',   icon: 'Wrench',          roles: MAINT_ROLES },
    ],
  },
  {
    label: 'Front Desk',
    items: [
      { label: 'Front Desk',  path: '/front-desk',   icon: 'ConciergeBell',  roles: FD_ROLES },
      { label: 'Guests',      path: '/guests',        icon: 'Users',           roles: FD_ROLES },
      { label: 'Concierge',   path: '/front-desk/concierge', icon: 'MapPin', roles: ['gm', 'admin', 'concierge', 'front_desk'] },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Schedule',    path: '/schedule',      icon: 'Calendar',        roles: [...MANAGEMENT, 'housekeeping_manager', 'maintenance_manager'] },
      { label: 'Reports',     path: '/reports',        icon: 'BarChart3',       roles: MANAGEMENT },
      { label: 'Compliance',  path: '/compliance',     icon: 'ClipboardCheck',  roles: MANAGEMENT },
      { label: 'Settings',    path: '/settings',       icon: 'Settings',        roles: MANAGEMENT },
      { label: 'Staff',       path: '/staff',          icon: 'UserCog',         roles: MANAGEMENT },
    ],
  },
];

export const MOBILE_NAV_CONFIG: Record<Role, NavItem[]> = {
  gm: [
    { label: 'Dashboard', path: '/',            icon: 'LayoutDashboard', roles: ALL_ROLES },
    { label: 'Rooms',     path: '/rooms',       icon: 'BedDouble',       roles: ALL_ROLES },
    { label: 'HK',        path: '/housekeeping', icon: 'Sparkles',       roles: ALL_ROLES },
    { label: 'Maint',     path: '/maintenance',  icon: 'Wrench',         roles: ALL_ROLES },
    { label: 'Reports',   path: '/reports',       icon: 'BarChart3',     roles: ALL_ROLES },
  ],
  admin: [
    { label: 'Dashboard', path: '/',            icon: 'LayoutDashboard', roles: ALL_ROLES },
    { label: 'Rooms',     path: '/rooms',       icon: 'BedDouble',       roles: ALL_ROLES },
    { label: 'Staff',     path: '/staff',       icon: 'UserCog',         roles: ALL_ROLES },
    { label: 'Reports',   path: '/reports',      icon: 'BarChart3',      roles: ALL_ROLES },
    { label: 'Settings',  path: '/settings',     icon: 'Settings',       roles: ALL_ROLES },
  ],
  front_desk: [
    { label: 'Front Desk', path: '/front-desk',  icon: 'ConciergeBell', roles: ALL_ROLES },
    { label: 'Rooms',      path: '/rooms',        icon: 'BedDouble',    roles: ALL_ROLES },
    { label: 'Guests',     path: '/guests',        icon: 'Users',       roles: ALL_ROLES },
    { label: 'Check In',   path: '/front-desk/check-in', icon: 'LogIn', roles: ALL_ROLES },
    { label: 'Concierge',  path: '/front-desk/concierge', icon: 'MapPin', roles: ALL_ROLES },
  ],
  housekeeping_manager: [
    { label: 'HK Board',  path: '/housekeeping', icon: 'Sparkles',       roles: ALL_ROLES },
    { label: 'Rooms',     path: '/rooms',         icon: 'BedDouble',     roles: ALL_ROLES },
    { label: 'Schedule',  path: '/schedule',       icon: 'Calendar',     roles: ALL_ROLES },
    { label: 'Reports',   path: '/reports',        icon: 'BarChart3',    roles: ALL_ROLES },
    { label: 'Dashboard', path: '/',               icon: 'LayoutDashboard', roles: ALL_ROLES },
  ],
  housekeeper: [
    { label: 'My Tasks',  path: '/housekeeping/my-tasks', icon: 'ClipboardList', roles: ALL_ROLES },
    { label: 'Rooms',     path: '/rooms',           icon: 'BedDouble',     roles: ALL_ROLES },
    { label: 'Schedule',  path: '/schedule/my',      icon: 'Calendar',     roles: ALL_ROLES },
    { label: 'Report',    path: '/',                  icon: 'AlertTriangle', roles: ALL_ROLES },
    { label: 'Dashboard', path: '/',                  icon: 'LayoutDashboard', roles: ALL_ROLES },
  ],
  maintenance_manager: [
    { label: 'Maint',     path: '/maintenance',     icon: 'Wrench',          roles: ALL_ROLES },
    { label: 'WOs',       path: '/maintenance/work-orders', icon: 'ClipboardList', roles: ALL_ROLES },
    { label: 'Equipment', path: '/maintenance/equipment', icon: 'Cpu',        roles: ALL_ROLES },
    { label: 'Schedule',  path: '/schedule',          icon: 'Calendar',       roles: ALL_ROLES },
    { label: 'Dashboard', path: '/',                   icon: 'LayoutDashboard', roles: ALL_ROLES },
  ],
  technician: [
    { label: 'My WOs',    path: '/maintenance/work-orders', icon: 'ClipboardList', roles: ALL_ROLES },
    { label: 'Rooms',     path: '/rooms',            icon: 'BedDouble',       roles: ALL_ROLES },
    { label: 'Equipment', path: '/maintenance/equipment', icon: 'Cpu',         roles: ALL_ROLES },
    { label: 'Schedule',  path: '/schedule/my',       icon: 'Calendar',       roles: ALL_ROLES },
    { label: 'Dashboard', path: '/',                   icon: 'LayoutDashboard', roles: ALL_ROLES },
  ],
  concierge: [
    { label: 'Concierge', path: '/front-desk/concierge', icon: 'MapPin',    roles: ALL_ROLES },
    { label: 'Guests',    path: '/guests',             icon: 'Users',       roles: ALL_ROLES },
    { label: 'Front Desk',path: '/front-desk',          icon: 'ConciergeBell', roles: ALL_ROLES },
    { label: 'Rooms',     path: '/rooms',               icon: 'BedDouble',  roles: ALL_ROLES },
    { label: 'Dashboard', path: '/',                     icon: 'LayoutDashboard', roles: ALL_ROLES },
  ],
};
