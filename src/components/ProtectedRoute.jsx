import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const ProtectedRoute = ({ children, requireRole }) => {
    const { user, role, loading } = useAuthStore();

    if (loading) {
        return <div className="h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!user) {
        if (requireRole === 'guest') {
            return <Navigate to="/guest/login" replace />;
        }
        return <Navigate to="/login" replace />;
    }

    if (requireRole && role !== requireRole) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
