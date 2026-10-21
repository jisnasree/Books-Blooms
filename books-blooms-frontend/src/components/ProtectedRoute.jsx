import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";

function ProtectedRoute() {
  const { user, loading } = useContext(UserContext);

    // Wait until authentication has been checked.
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;