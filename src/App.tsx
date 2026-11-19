import 'leaflet/dist/leaflet.css';

import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';

import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import AdminPortal from './pages/AdminPortal';

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
      <Routes>
        <Route path="/" element={<AuthPage setToken={setToken} />} />
        <Route
          path="/dashboard"
          element={token ? <Dashboard token={token} /> : <Navigate to="/" />}
        />
        <Route path="/admin/*"
          element={token ? <AdminPortal token={token} setToken={setToken} /> : <Navigate to="/" />}
        />
      </Routes>
    </Router>
  );
};

export default App;
