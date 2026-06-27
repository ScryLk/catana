import api from './api';
import type { Catalog } from '@/types/api';

export const catalogService = {
    /**
     * Busca todos os catálogos (com filtros de sede/org)
     */
    async getAllCatalogs(params?: { sede?: number; organization?: number }): Promise<Catalog[]> {
        try {
            const queryParams = new URLSearchParams();
            if (params?.sede) queryParams.append('sede', params.sede.toString());
            if (params?.organization) queryParams.append('organization', params.organization.toString());

            const response = await api.get<Catalog[]>(`/api/catalogs/?${queryParams.toString()}`);
            return response.data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } catch (error) {
            console.error('Error fetching all catalogs:', error);
            return [];
        }
    },

    /**
     * Busca catálogos públicos para o Explorer
     */
    async getExploreCatalogs(search?: string, filters?: any): Promise<Catalog[]> {
        try {
            const queryParams = new URLSearchParams();
            if (search) queryParams.append('search', search);

            if (filters) {
                if (filters.category) queryParams.append('category', filters.category);
                // Add other filters as needed
            }

            const response = await api.get<Catalog[]>(`/api/catalogs/explore/?${queryParams.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching explore catalogs:', error);
            return [];
        }
    },

    /**
     * Busca um catálogo por ID (com detalhes completos)
     */
    async getCatalog(id: number): Promise<Catalog> {
        const response = await api.get<Catalog>(`/api/catalogs/${id}/`);
        return response.data;
    },

    /**
     * Cria um novo catálogo
     */
    async createCatalog(payload: Partial<Catalog>): Promise<Catalog> {
        const response = await api.post<Catalog>('/api/catalogs/', payload);
        return response.data;
    },

    /**
     * Atualiza um catálogo existente
     */
    async updateCatalog(id: number, payload: Partial<Catalog>): Promise<Catalog> {
        const response = await api.patch<Catalog>(`/api/catalogs/${id}/`, payload);
        return response.data;
    },

    async toggleLike(id: number): Promise<{ liked: boolean; count: number }> {
        const response = await api.post<{ liked: boolean; count: number }>(`/api/catalogs/${id}/like/`);
        return response.data;
    },

    async toggleSave(id: number): Promise<{ saved: boolean; count: number }> {
        const response = await api.post<{ saved: boolean; count: number }>(`/api/catalogs/${id}/toggle_save/`);
        return response.data;
    },

    /**
     * Remove um catálogo
     */
    async deleteCatalog(id: number): Promise<void> {
        await api.delete(`/api/catalogs/${id}/`);
    },
};
