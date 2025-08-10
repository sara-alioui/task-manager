import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ModernAdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import MesGroupes from './pages/MesGroupes'; // 🔹 N'oublie pas d'avoir ce fichier

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner">Chargement...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner">Chargement...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'admin' ? children : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
      <Route path="/admin-dashboard" element={<AdminRoute><ModernAdminDashboard /></AdminRoute>} />
      <Route path="/mes-groupes" element={<ProtectedRoute><MesGroupes /></ProtectedRoute>} /> {/* 🔹 Nouvelle route ajoutée */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
