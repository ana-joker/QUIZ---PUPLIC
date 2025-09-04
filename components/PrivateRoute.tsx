import { Navigate } from "react-router-dom";
import { useAuthStore } from "../context/AuthContext";
import { ReactNode } from "react";


/**
 * PrivateRoute: يحمي المسارات حسب تسجيل الدخول والدور
 * @param roles: مصفوفة أدوار مسموحة (مثلاً ['admin','owner'])
 * @example <PrivateRoute roles={['teacher','admin']}>...</PrivateRoute>
 */
const PrivateRoute = ({ children, roles }: { children: ReactNode, roles?: string[] }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (roles && roles.length > 0 && (!user || !roles.includes(user.role))) {
    // توجيه ذكي حسب الدور
    if (user?.role === 'student') return <Navigate to="/dashboard" />;
    if (user?.role === 'teacher') return <Navigate to="/teacher/dashboard" />;
    if (user?.role === 'admin' || user?.role === 'owner') return <Navigate to="/admin/dashboard" />;
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
