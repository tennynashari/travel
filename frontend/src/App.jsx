import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MasterKota from './pages/MasterKota';
import MasterRute from './pages/MasterRute';
import { authService } from './services/api';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard user={user} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/master-kota" 
          element={
            <ProtectedRoute>
              <Dashboard user={user} page="kota" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/master-rute" 
          element={
            <ProtectedRoute>
              <Dashboard user={user} page="rute" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/master-template-kursi" 
          element={
            <ProtectedRoute>
              <Dashboard user={user} page="template-kursi" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/master-armada" 
          element={
            <ProtectedRoute>
              <Dashboard user={user} page="armada" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/master-driver" 
          element={
            <ProtectedRoute>
              <Dashboard user={user} page="driver" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/jadwal-perjalanan" 
          element={
            <ProtectedRoute>
              <Dashboard user={user} page="jadwal" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/booking-tiket" 
          element={
            <ProtectedRoute>
              <Dashboard user={user} page="booking" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/pembayaran" 
          element={
            <ProtectedRoute>
              <Dashboard user={user} page="pembayaran" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/check-in" 
          element={
            <ProtectedRoute>
              <Dashboard user={user} page="checkin" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/laporan" 
          element={
            <ProtectedRoute>
              <Dashboard user={user} page="laporan" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/manajemen-user" 
          element={
            <ProtectedRoute>
              <Dashboard user={user} page="users" />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
