import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Drivers from './pages/Drivers';
import Map from './pages/Map';
import Bookings from './pages/Bookings';
import Payments from './pages/Payments';
import Customers from './pages/Customers';
import Security from './pages/Security';
import Settings from './pages/Settings';
import Login from './pages/Login';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="drivers" element={<Drivers />} />
              <Route path="map" element={<Map />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="payments" element={<Payments />} />
              <Route path="customers" element={<Customers />} />
              <Route path="security" element={<Security />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
