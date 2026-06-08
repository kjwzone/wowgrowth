import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ProgramsPage from "@/pages/ProgramsPage";
import ProgramDetailPage from "@/pages/ProgramDetailPage";
import CompanyProfilePage from "@/pages/CompanyProfilePage";
import CompanyDiagnosisReportPage from "@/pages/CompanyDiagnosisReportPage";
import MatchingResultsPage from "@/pages/MatchingResultsPage";
import BusinessPlanPage from "@/pages/BusinessPlanPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  {
    element: <AppLayout />,
    children: [
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/programs", element: <ProgramsPage /> },
      { path: "/programs/:id", element: <ProgramDetailPage /> },
      { path: "/company-profile", element: <CompanyProfilePage /> },
      { path: "/company-diagnosis", element: <CompanyDiagnosisReportPage /> },
      { path: "/matching-results", element: <MatchingResultsPage /> },
      { path: "/business-plan", element: <BusinessPlanPage /> },
      { path: "/admin/dashboard", element: <AdminDashboardPage /> },
      { path: "/admin/review", element: <Navigate to="/admin/dashboard" replace /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
