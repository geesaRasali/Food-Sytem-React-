import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Add from './pages/Add/Add';
import List from './pages/List/List';
import StockControl from './pages/Stock Control/Stock Control';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Orders from './pages/Orders/Orders';
import Dashboard from './pages/Dashboard/Dashboard';
import Login from './pages/Login/Login';
import AccessDenied from './pages/AccessDenied/AccessDenied';
import StaffUsers from './pages/StaffUsers/StaffUsers';
import Messages from './pages/Messages/Messages';
import Categories from './pages/Categories/Categories';
import SupplierManagement from './pages/SupplierManagement/SupplierManagement';
import KitchenMonitoring from './pages/KitchenMonitoring/KitchenMonitoring';
import DeliveryMonitoring from './pages/DeliveryMonitoring/DeliveryMonitoring';
import ReportsAnalytics from './pages/ReportsAnalytics/ReportsAnalytics';
import Settings from './pages/Settings/Settings';
import { hasPermission, isAdminPanelRole, normalizeRole } from './config/rbac';

const App = () => {
  const url = 'http://localhost:4000';
  const navigate = useNavigate();
  const [adminToken, setAdminToken] = useState('');
  const [adminUser, setAdminUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('adminTheme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [messages, setMessages] = useState([]);

  const fetchMessagesCount = async () => {
    if (!url || !adminToken) return;
    try {
      const response = await axios.get(`${url}/api/contact/list`, {
        headers: { token: adminToken, Authorization: `Bearer ${adminToken}` },
      });
      if (response.data?.success) {
        setMessages(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch contact messages count:', error);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    const savedUser = localStorage.getItem('adminUser');

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        const normalizedRole = normalizeRole(parsedUser?.role);
        if (isAdminPanelRole(normalizedRole)) {
          setAdminToken(savedToken);
          setAdminUser({ ...parsedUser, role: normalizedRole });
        } else {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
        }
      } catch (error) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      }
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', isDarkMode);
    localStorage.setItem('adminTheme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    if (adminToken) {
      fetchMessagesCount();
      const interval = setInterval(fetchMessagesCount, 30000);
      return () => clearInterval(interval);
    }
  }, [url, adminToken]);

  const getDefaultRouteForRole = (role) => {
    if (hasPermission(role, 'dashboard')) return '/';
    if (hasPermission(role, 'addFood')) return '/add';
    if (hasPermission(role, 'listFood')) return '/list';
    if (hasPermission(role, 'categories')) return '/categories';
    if (hasPermission(role, 'stockControl')) return '/stock-control';
    if (hasPermission(role, 'supplierManagement')) return '/supplier-management';
    if (hasPermission(role, 'kitchenMonitoring')) return '/kitchen-monitoring';
    if (hasPermission(role, 'deliveryMonitoring')) return '/delivery-monitoring';
    if (hasPermission(role, 'orders')) return '/orders';
    if (hasPermission(role, 'messages')) return '/admin/messages';
    if (hasPermission(role, 'staffUsers')) return '/staff-users';
    if (hasPermission(role, 'reports')) return '/reports-analytics';
    if (hasPermission(role, 'settings')) return '/settings';
    return '/access-denied';
  };

  const handleAdminLogin = (token, user) => {
    const normalizedUser = { ...user, role: normalizeRole(user?.role) };
    setAdminToken(token);
    setAdminUser(normalizedUser);
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify(normalizedUser));
    navigate(getDefaultRouteForRole(normalizedUser.role), { replace: true });
  };

  const handleLogout = () => {
    setAdminToken('');
    setAdminUser(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/', { replace: true });
  };

  if (!adminToken || !isAdminPanelRole(adminUser?.role)) {
    return (
      <div>
        <ToastContainer />
        <Login url={url} onAdminLogin={handleAdminLogin} />
      </div>
    );
  }

  const canViewDashboard = hasPermission(adminUser?.role, 'dashboard');
  const canManageFood = hasPermission(adminUser?.role, 'addFood');
  const canListFood = hasPermission(adminUser?.role, 'listFood');
  const canViewCategories = hasPermission(adminUser?.role, 'categories');
  const canViewStockControl = hasPermission(adminUser?.role, 'stockControl');
  const canViewSupplierManagement = hasPermission(adminUser?.role, 'supplierManagement');
  const canViewKitchenMonitoring = hasPermission(adminUser?.role, 'kitchenMonitoring');
  const canViewDeliveryMonitoring = hasPermission(adminUser?.role, 'deliveryMonitoring');
  const canManageOrders = hasPermission(adminUser?.role, 'orders');
  const canViewMessages = hasPermission(adminUser?.role, 'messages');
  const canManageUsers = hasPermission(adminUser?.role, 'staffUsers');
  const canViewReports = hasPermission(adminUser?.role, 'reports');
  const canViewSettings = hasPermission(adminUser?.role, 'settings');

  const defaultRoute = getDefaultRouteForRole(adminUser?.role);

  return (
    <div className="min-h-screen bg-zinc-50 pt-16 transition-colors dark:bg-zinc-900 font-sans">
      <ToastContainer />
      <Navbar
        adminUser={adminUser}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
      />
      <div className="flex">
        <Sidebar
          adminUser={adminUser}
          pendingMessagesCount={messages.filter((m) => !m.reply || m.reply.trim() === '').length}
        />
        <div className="min-w-0 flex-1 ml-[18%]">
          <Routes>
            <Route path="/" element={canViewDashboard ? <Dashboard url={url} adminToken={adminToken} adminUser={adminUser} /> : <Navigate to={defaultRoute} replace />} />
            <Route path="/add" element={canManageFood ? <Add url={url} adminToken={adminToken} /> : <Navigate to={defaultRoute} replace />} />
            <Route path="/list" element={canListFood ? <List url={url} adminToken={adminToken} /> : <Navigate to={defaultRoute} replace />} />
            <Route path="/categories" element={canViewCategories ? <Categories /> : <Navigate to={defaultRoute} replace />} />
            <Route path="/stock-control/*" element={canViewStockControl ? <StockControl url={url} adminToken={adminToken} /> : <Navigate to={defaultRoute} replace />} />
            <Route path="/supplier-management" element={canViewSupplierManagement ? <SupplierManagement url={url} adminToken={adminToken} /> : <Navigate to={defaultRoute} replace />} />
            <Route path="/kitchen-monitoring" element={canViewKitchenMonitoring ? <KitchenMonitoring url={url} adminToken={adminToken} adminUser={adminUser} /> : <Navigate to={defaultRoute} replace />} />
            <Route path="/delivery-monitoring" element={canViewDeliveryMonitoring ? <DeliveryMonitoring url={url} adminToken={adminToken} adminUser={adminUser} /> : <Navigate to={defaultRoute} replace />} />
            <Route path="/orders" element={canManageOrders ? <Orders url={url} adminToken={adminToken} adminUser={adminUser} /> : <Navigate to={defaultRoute} replace />} />
            <Route path="/admin/messages" element={canViewMessages ? <Messages url={url} adminToken={adminToken} /> : <Navigate to={defaultRoute} replace />} />
            <Route path="/staff-users" element={canManageUsers ? <StaffUsers url={url} adminToken={adminToken} /> : <Navigate to={defaultRoute} replace />} />
            <Route path="/reports-analytics" element={canViewReports ? <ReportsAnalytics url={url} adminToken={adminToken} adminUser={adminUser} /> : <Navigate to={defaultRoute} replace />} />
            <Route path="/settings" element={canViewSettings ? <Settings url={url} adminToken={adminToken} adminUser={adminUser} setAdminUser={setAdminUser} /> : <Navigate to={defaultRoute} replace />} />
            <Route path="/access-denied" element={<AccessDenied />} />
            <Route path="*" element={<Navigate to={defaultRoute} replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;