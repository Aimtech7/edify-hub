import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute, RoleProtectedRoute } from "./guards";
import { DashboardLayout } from "@/layouts/dashboard-layout";

import LandingPage from "@/pages/LandingPage";
import NotFoundPage from "@/pages/NotFoundPage";
import UnauthorizedPage from "@/pages/UnauthorizedPage";
import SessionTimeoutPage from "@/pages/SessionTimeoutPage";

import LoginStudentPage from "@/pages/auth/LoginStudentPage";
import LoginParentPage from "@/pages/auth/LoginParentPage";
import LoginStaffPage from "@/pages/auth/LoginStaffPage";
import LoginAdminPage from "@/pages/auth/LoginAdminPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ChangePasswordPage from "@/pages/auth/ChangePasswordPage";

import DashboardPage from "@/pages/app/DashboardPage";
import StudentsPage from "@/pages/app/StudentsPage";
import LevelsPage from "@/pages/app/LevelsPage";
import PaymentsPage from "@/pages/app/PaymentsPage";
import AllocationsPage from "@/pages/app/AllocationsPage";
import ReceiptsPage from "@/pages/app/ReceiptsPage";
import ResultsPage from "@/pages/app/ResultsPage";
import AttendancePage from "@/pages/app/AttendancePage";
import UsersPage from "@/pages/app/UsersPage";
import RolesPage from "@/pages/app/RolesPage";
import SettingsPage from "@/pages/app/SettingsPage";
import AuditLogsPage from "@/pages/app/AuditLogsPage";
import AcademicPage from "@/pages/app/AcademicPage";
import FeeStructurePage from "@/pages/app/FeeStructurePage";
import FinancePage from "@/pages/app/FinancePage";
import FinanceReportsPage from "@/pages/app/FinanceReportsPage";
import MarksPage from "@/pages/app/MarksPage";
import ReportsPage from "@/pages/app/ReportsPage";
import ProfilePage from "@/pages/app/ProfilePage";
import CertificatesPage from "@/pages/app/CertificatesPage";
import OdelCoursesPage from "@/pages/app/OdelCoursesPage";
import LearningPlayerPage from "@/pages/app/LearningPlayerPage";
import { DigitalLibraryPage } from "@/pages/app/DigitalLibraryPage";
import { CommunicationPage } from "@/pages/app/CommunicationPage";

import PublicVerifyPage from "@/pages/PublicVerifyPage";
import AdmissionsPortalPage from "@/pages/AdmissionsPortalPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/verify/:certNo?" element={<PublicVerifyPage />} />
      <Route path="/admissions" element={<AdmissionsPortalPage />} />

      <Route path="/login/student" element={<LoginStudentPage />} />
      <Route path="/login/parent" element={<LoginParentPage />} />
      <Route path="/login/staff" element={<LoginStaffPage />} />
      <Route path="/login/admin" element={<LoginAdminPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route path="/session-timeout" element={<SessionTimeoutPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="profile"   element={<ProfilePage />} />
        <Route path="results"   element={<ResultsPage />} />
        <Route
          path="certificates"
          element={
            <RoleProtectedRoute allowed={["student", "teacher", "admin"]}>
              <CertificatesPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="receipts"
          element={
            <RoleProtectedRoute allowed={["student", "accountant", "admin"]}>
              <ReceiptsPage />
            </RoleProtectedRoute>
          }
        />

        {/* Language Levels — student (read-only), teacher, admin */}
        <Route
          path="levels"
          element={
            <RoleProtectedRoute allowed={["student", "teacher", "admin"]}>
              <LevelsPage />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="odel-courses"
          element={
            <RoleProtectedRoute allowed={["teacher", "admin"]}>
              <OdelCoursesPage />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="player"
          element={
            <RoleProtectedRoute allowed={["student", "teacher", "admin"]}>
              <LearningPlayerPage />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="library"
          element={
            <RoleProtectedRoute allowed={["student", "teacher", "admin"]}>
              <DigitalLibraryPage />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="communication"
          element={
            <RoleProtectedRoute allowed={["student", "teacher", "accountant", "admin"]}>
              <CommunicationPage />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="finance"
          element={
            <RoleProtectedRoute allowed={["student"]}>
              <FinancePage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="students"
          element={
            <RoleProtectedRoute allowed={["teacher", "admin"]}>
              <StudentsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="marks"
          element={
            <RoleProtectedRoute allowed={["teacher"]}>
              <MarksPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="attendance"
          element={
            <RoleProtectedRoute allowed={["teacher", "student", "admin"]}>
              <AttendancePage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="reports"
          element={
            <RoleProtectedRoute allowed={["teacher", "admin"]}>
              <ReportsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="payments"
          element={
            <RoleProtectedRoute allowed={["accountant"]}>
              <PaymentsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="allocations"
          element={
            <RoleProtectedRoute allowed={["accountant"]}>
              <AllocationsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="finance-reports"
          element={
            <RoleProtectedRoute allowed={["accountant", "admin"]}>
              <FinanceReportsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <RoleProtectedRoute allowed={["admin"]}>
              <UsersPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="roles"
          element={
            <RoleProtectedRoute allowed={["admin"]}>
              <RolesPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="academic"
          element={
            <RoleProtectedRoute allowed={["admin"]}>
              <AcademicPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="fee-structure"
          element={
            <RoleProtectedRoute allowed={["admin", "accountant"]}>
              <FeeStructurePage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <RoleProtectedRoute allowed={["admin"]}>
              <SettingsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="audit-logs"
          element={
            <RoleProtectedRoute allowed={["admin"]}>
              <AuditLogsPage />
            </RoleProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
