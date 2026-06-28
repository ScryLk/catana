import { type FC, type ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, AUTO_LOGIN_ENABLED } from '../../store/authStore';
import { LoadingScreen } from '../common/LoadingScreen';

interface PrivateRouteProps {
  children: ReactNode;
}

export const PrivateRoute: FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, checkAuth, autoLogin } = useAuthStore();
  const location = useLocation();

  const hasToken =
    typeof window !== 'undefined' && !!localStorage.getItem('access_token');
  // Enquanto o login automático tenta autenticar, seguramos a navegação.
  const [checking, setChecking] = useState(
    AUTO_LOGIN_ENABLED && !(isAuthenticated && hasToken)
  );

  useEffect(() => {
    checkAuth();
    if (AUTO_LOGIN_ENABLED && !(isAuthenticated && hasToken)) {
      autoLogin().finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingScreen message="Entrando..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirecionar para login, salvando a rota atual
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
