import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import CouponList from "./pages/CouponList";
import CouponDetail from "./pages/CouponDetail";
import CreateCoupon from "./pages/CreateCoupon";
import EditCoupon from "./pages/EditCoupon";
import Login from "./pages/Login";
import Register from "./pages/Register";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/coupons" element={<ProtectedRoute><CouponList /></ProtectedRoute>} />
          <Route path="/coupons/new" element={<ProtectedRoute><CreateCoupon /></ProtectedRoute>} />
          <Route path="/coupons/:id/edit" element={<ProtectedRoute><EditCoupon /></ProtectedRoute>} />
          <Route path="/coupons/:id" element={<ProtectedRoute><CouponDetail /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
