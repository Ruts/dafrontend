import 'leaflet/dist/leaflet.css';

import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';

import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminPortal = lazy(() => import('./pages/AdminPortal'));

const App = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('jwt'));

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem('jwt'));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <Router>
      <Suspense fallback={<p role="status">Loading your portal...</p>}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage setToken={setToken} />} />
        <Route
          path="/dashboard"
          element={token ? <Dashboard token={token} /> : <Navigate to="/login" replace />}
        />
        <Route path="/admin/*"
          element={token ? <AdminPortal token={token} setToken={setToken} /> : <Navigate to="/login?mode=admin" replace />}
        />
      </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
