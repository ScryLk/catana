import { logger } from '../utils/logger';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

// FRG-04: respeita VITE_API_BASE_URL como o resto dos services (api.ts).
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  username?: string;
  role?: 'admin' | 'editor' | 'viewer';
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  clearError: () => void;
  register: (user: any) => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          // Fazer login na API
          const response = await axios.post(`${API_BASE_URL}/api/auth/token/`, {
            username: credentials.username,
            password: credentials.password,
          });

          const { access, refresh } = response.data;

          // Salvar tokens no localStorage
          localStorage.setItem('access_token', access);
          localStorage.setItem('refresh_token', refresh);

          // Buscar dados do perfil do usuário
          const profileResponse = await axios.get(`${API_BASE_URL}/api/profile/`, {
            headers: {
              Authorization: `Bearer ${access}`,
            },
          });

          const userData = profileResponse.data;

          const user: User = {
            id: userData.id,
            name: userData.name || userData.username,
            email: userData.email,
            avatar: userData.avatar,
            username: userData.username,
            role: userData.role || 'viewer',
          };

          // 🏢 Auto-select Organização e Sede padrão no login
          // Busca as organizações do usuário
          try {
            const orgsResponse = await axios.get(`${API_BASE_URL}/api/organizations/`, {
              headers: {
                Authorization: `Bearer ${access}`,
              },
            });

            const organizations = orgsResponse.data;

            if (organizations && organizations.length > 0) {
              // Pega a primeira organização (ou a última usada, se implementado)
              const firstOrg = organizations[0];
              localStorage.setItem('active_organization', JSON.stringify(firstOrg));

              // Se tiver sede padrão, ativa automaticamente
              if (firstOrg.default_sede && firstOrg.sedes) {
                const defaultSede = firstOrg.sedes.find((s: any) => s.id === firstOrg.default_sede);
                if (defaultSede) {
                  localStorage.setItem('active_sede', JSON.stringify(defaultSede));
                }
              }
            }
          } catch (orgError) {
            console.error('Erro ao carregar organizações no login:', orgError);
            // Não bloqueia o login se falhar
          }

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          // Limpar tokens em caso de erro
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');

          set({
            error: err instanceof Error ? err.message : 'Erro ao fazer login',
            isLoading: false,
            user: null,
            isAuthenticated: false,
          });
          throw err;
        }
      },

      logout: () => {
        // Limpar tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');

        // 🏢 Limpar contexto de organização e sede
        localStorage.removeItem('active_organization');
        localStorage.removeItem('active_sede');

        set({ user: null, isAuthenticated: false });
      },

      checkAuth: () => {
        const { user } = get();
        const token = localStorage.getItem('access_token');

        if (user && token) {
          logger.debug('User authenticated:', user.name);
        } else if (!token && user) {
          // Token expirado mas ainda tem user no store
          set({ user: null, isAuthenticated: false });
        }
      },

      clearError: () => set({ error: null }),

      register: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          // Registrar usuário
          const response = await axios.post(`${API_BASE_URL}/api/register/`, credentials);

          const { user: userData, access, refresh, organization, default_sede } = response.data;

          // Salvar tokens no localStorage
          localStorage.setItem('access_token', access);
          localStorage.setItem('refresh_token', refresh);

          // 🏢 Salvar Organização e Sede criadas automaticamente
          if (organization) {
            localStorage.setItem('active_organization', JSON.stringify(organization));
          }
          if (default_sede) {
            localStorage.setItem('active_sede', JSON.stringify(default_sede));
          }

          // Formatar usuário para o store
          const user: User = {
            id: userData.id,
            name: userData.first_name || userData.username, // UserSerializer might return first/last name or just username
            email: userData.email,
            avatar: userData.avatar,
            username: userData.username,
            role: userData.role || 'viewer',
          };

          set({
            user,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (err: any) {
          const errorMessage = err.response?.data?.error || err.response?.data?.detail || err.message || 'Erro ao registrar';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw err;
        }
      },
    }),
    {
      name: 'catana-auth-storage',
    }
  )
);
