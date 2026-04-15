import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from '@/components/ui/Toast';
import { FirestoreProvider } from '@/context/FirestoreContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

// Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { RoomBoardPage } from '@/pages/rooms/RoomBoardPage';
import { RoomDetailPage } from '@/pages/rooms/RoomDetailPage';
import { HousekeepingDashboardPage } from '@/pages/housekeeping/HousekeepingDashboardPage';
import { MyTasksPage } from '@/pages/housekeeping/MyTasksPage';
import { HousekeepingBoardPage } from '@/pages/housekeeping/HousekeepingBoardPage';
import { AssignmentListPage } from '@/pages/housekeeping/AssignmentListPage';
import { CreateAssignmentPage } from '@/pages/housekeeping/CreateAssignmentPage';
import { InspectionPage } from '@/pages/housekeeping/InspectionPage';
import { MaintenanceDashboardPage } from '@/pages/maintenance/MaintenanceDashboardPage';
import { WorkOrderListPage } from '@/pages/maintenance/WorkOrderListPage';
import { CreateWorkOrderPage } from '@/pages/maintenance/CreateWorkOrderPage';
import { WorkOrderDetailPage } from '@/pages/maintenance/WorkOrderDetailPage';
import { EquipmentListPage } from '@/pages/maintenance/EquipmentListPage';
import { EquipmentDetailPage } from '@/pages/maintenance/EquipmentDetailPage';
import { FrontDeskDashboardPage } from '@/pages/front-desk/FrontDeskDashboardPage';
import { CheckInPage } from '@/pages/front-desk/CheckInPage';
import { CheckOutPage } from '@/pages/front-desk/CheckOutPage';
import { ArrivalsPage } from '@/pages/front-desk/ArrivalsPage';
import { DeparturesPage } from '@/pages/front-desk/DeparturesPage';
import { NewReservationPage } from '@/pages/front-desk/NewReservationPage';
import { WalkInPage } from '@/pages/front-desk/WalkInPage';
import { ConciergePage } from '@/pages/front-desk/ConciergePage';
import { GuestListPage } from '@/pages/guests/GuestListPage';
import { GuestProfilePage } from '@/pages/guests/GuestProfilePage';
import { SchedulePage } from '@/pages/schedule/SchedulePage';
import { MySchedulePage } from '@/pages/schedule/MySchedulePage';
import { ReportsDashboardPage } from '@/pages/reports/ReportsDashboardPage';
import { OccupancyReportPage } from '@/pages/reports/OccupancyReportPage';
import { WorkOrdersReportPage } from '@/pages/reports/WorkOrdersReportPage';
import { HousekeepingReportPage } from '@/pages/reports/HousekeepingReportPage';
import { GuestRequestsReportPage } from '@/pages/reports/GuestRequestsReportPage';
import { LaborReportPage } from '@/pages/reports/LaborReportPage';
import { ResponseTimesReportPage } from '@/pages/reports/ResponseTimesReportPage';
import { ComplianceDashboardPage } from '@/pages/compliance/ComplianceDashboardPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { StaffManagementPage } from '@/pages/settings/StaffManagementPage';

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <FirestoreProvider>
      <ToastProvider>
        <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes inside layout */}
        <Route element={<ProtectedLayout />}>
          {/* Dashboard */}
          <Route path="/" element={<DashboardPage />} />

          {/* Rooms */}
          <Route path="/rooms" element={<RoomBoardPage />} />
          <Route path="/rooms/:id" element={<RoomDetailPage />} />

          {/* Housekeeping */}
          <Route path="/housekeeping" element={<HousekeepingDashboardPage />} />
          <Route path="/housekeeping/my-tasks" element={<MyTasksPage />} />
          <Route path="/housekeeping/board" element={<HousekeepingBoardPage />} />
          <Route path="/housekeeping/assignments" element={<AssignmentListPage />} />
          <Route path="/housekeeping/assignments/new" element={<CreateAssignmentPage />} />
          <Route path="/housekeeping/inspect/:id" element={<InspectionPage />} />

          {/* Maintenance */}
          <Route path="/maintenance" element={<MaintenanceDashboardPage />} />
          <Route path="/maintenance/work-orders" element={<WorkOrderListPage />} />
          <Route path="/maintenance/work-orders/new" element={<CreateWorkOrderPage />} />
          <Route path="/maintenance/work-orders/:id" element={<WorkOrderDetailPage />} />
          <Route path="/maintenance/equipment" element={<EquipmentListPage />} />
          <Route path="/maintenance/equipment/:id" element={<EquipmentDetailPage />} />

          {/* Front Desk */}
          <Route path="/front-desk" element={<FrontDeskDashboardPage />} />
          <Route path="/front-desk/check-in" element={<CheckInPage />} />
          <Route path="/front-desk/check-out" element={<CheckOutPage />} />
          <Route path="/front-desk/arrivals" element={<ArrivalsPage />} />
          <Route path="/front-desk/departures" element={<DeparturesPage />} />
          <Route path="/front-desk/new-reservation" element={<NewReservationPage />} />
          <Route path="/front-desk/walk-in" element={<WalkInPage />} />
          <Route path="/front-desk/concierge" element={<ConciergePage />} />

          {/* Guests */}
          <Route path="/guests" element={<GuestListPage />} />
          <Route path="/guests/:id" element={<GuestProfilePage />} />

          {/* Schedule */}
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/schedule/my" element={<MySchedulePage />} />

          {/* Reports */}
          <Route path="/reports" element={<ReportsDashboardPage />} />
          <Route path="/reports/occupancy" element={<OccupancyReportPage />} />
          <Route path="/reports/work-orders" element={<WorkOrdersReportPage />} />
          <Route path="/reports/housekeeping" element={<HousekeepingReportPage />} />
          <Route path="/reports/guest-requests" element={<GuestRequestsReportPage />} />
          <Route path="/reports/labor" element={<LaborReportPage />} />
          <Route path="/reports/response-times" element={<ResponseTimesReportPage />} />

          {/* Compliance */}
          <Route path="/compliance" element={<ComplianceDashboardPage />} />

          {/* Settings & Staff */}
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/staff" element={<StaffManagementPage />} />
        </Route>
        </Routes>
      </ToastProvider>
    </FirestoreProvider>
  );
}
