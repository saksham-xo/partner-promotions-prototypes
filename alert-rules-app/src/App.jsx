import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './data/store';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import Toast from './components/shared/Toast';
import AlertRules from './pages/AlertRules';
import Claims from './pages/Claims';
import AlertDashboard from './pages/AlertDashboard';
import ViewInvoice from './pages/ViewInvoice';
import RolePermissions from './pages/RolePermissions';
import AlertsExtended from './pages/AlertsExtended';
import ViewAlert from './pages/ViewAlert';
import EditAlert from './pages/EditAlert';
import CreateAlert from './pages/CreateAlert';
import CreateApproveRule from './pages/CreateApproveRule';
import ViewApproveRule from './pages/ViewApproveRule';
import EditApproveRule from './pages/EditApproveRule';
import CreateLookupAttribute from './pages/CreateLookupAttribute';
import ManageLookupAttribute from './pages/ManageLookupAttribute';
import MappingForm from './pages/MappingForm';
import CreateInvoiceAttribute from './pages/CreateInvoiceAttribute';
import ManageInvoiceAttribute from './pages/ManageInvoiceAttribute';

export default function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <div className="flex flex-col h-screen">
          {/* Header — full browser width, fixed */}
          <div className="shrink-0 sticky top-0 z-50">
            <Topbar />
          </div>

          {/* Below header — single scroll container */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex max-w-[1440px] w-full mx-auto min-h-full pt-4">
              <Sidebar />
              <div className="flex-1 px-2">
              <Routes>
                <Route path="/" element={<Navigate to="/partner-promotions/invoice-management" replace />} />
                <Route path="/partner-promotions/invoice-management" element={<Claims />} />
                <Route path="/partner-promotions/invoice-management/:index" element={<ViewInvoice />} />
                <Route path="/partner-promotions/invoice-management/settings" element={<AlertRules />} />
                <Route path="/partner-promotions/invoice-management/settings/alerts/create" element={<CreateAlert />} />
                <Route path="/partner-promotions/invoice-management/settings/alerts/:id" element={<ViewAlert />} />
                <Route path="/partner-promotions/invoice-management/settings/alerts/:id/edit" element={<EditAlert />} />
                <Route path="/partner-promotions/invoice-management/settings/approve/create" element={<CreateApproveRule />} />
                <Route path="/partner-promotions/invoice-management/settings/approve/:id" element={<ViewApproveRule />} />
                <Route path="/partner-promotions/invoice-management/settings/approve/:id/edit" element={<EditApproveRule />} />
                <Route path="/partner-promotions/invoice-management/settings/lookup-attributes/create" element={<CreateLookupAttribute />} />
                <Route path="/partner-promotions/invoice-management/settings/lookup-attributes/:id" element={<ManageLookupAttribute />} />
                <Route path="/partner-promotions/invoice-management/settings/lookup-attributes/:id/mapping/create" element={<MappingForm />} />
                <Route path="/partner-promotions/invoice-management/settings/lookup-attributes/:id/mapping/:mappingId/edit" element={<MappingForm />} />
                <Route path="/partner-promotions/invoice-management/settings/invoice-attributes/create" element={<CreateInvoiceAttribute />} />
                <Route path="/partner-promotions/invoice-management/settings/invoice-attributes/:id" element={<ManageInvoiceAttribute />} />
                <Route path="/alerts-extended" element={<AlertsExtended />} />
                <Route path="/alert-dashboard" element={<AlertDashboard />} />
                <Route path="/role-permissions" element={<RolePermissions />} />
              </Routes>
            </div>
            </div>
          </div>
        </div>
        <Toast />
      </StoreProvider>
    </BrowserRouter>
  );
}
