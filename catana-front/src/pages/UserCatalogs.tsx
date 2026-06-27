import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { catalogService } from '../services/catalogService';
import { Catalog } from '@/types/api';
import {
    Loader2,
    Plus,
    BookOpen,
    FileEdit,
    Trash2,
    Eye,
    Calendar,
    Search,
    Share2,
    LayoutTemplate,
    Upload
} from 'lucide-react';

import { CreateCatalogModal } from '../components/catalog/CreateCatalogModal';
import { EditCatalogModal } from '../components/catalog/EditCatalogModal';
import { ImportCatalogModal } from '../components/editor/ImportCatalogModal';

export const UserCatalogs: FC = () => {
    const navigate = useNavigate();
    const [catalogs, setCatalogs] = useState<Catalog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingCatalog, setEditingCatalog] = useState<Catalog | null>(null);
    const [activeSedeId, setActiveSedeId] = useState<number | null>(null);
    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => {
        const storedSede = localStorage.getItem('active_sede');
        if (storedSede) {
            try {
                const parsed = JSON.parse(storedSede);
                setActiveSedeId(parsed.id || parsed);
            } catch {
                setActiveSedeId(Number(storedSede));
            }
        }
        loadCatalogs();
    }, []);

    const handleOpenEditor = (catalog: Catalog) => {
        setIsNavigating(true);
        // Small delay to let the animation play and give a sense of "loading context"
        setTimeout(() => {
            navigate(`/editor?catalog=${catalog.id}`, {
                state: {
                    catalogId: catalog.id,
                    catalogName: catalog.title
                }
            });
        }, 800);
    };

    const loadCatalogs = async () => {
        setLoading(true);
        try {
            const storedSede = localStorage.getItem('active_sede');
            const storedOrg = localStorage.getItem('active_organization');

            const getId = (item: string | null) => {
                if (!item) return undefined;
                try {
                    const parsed = JSON.parse(item);
                    return parsed.id ? Number(parsed.id) : Number(item);
                } catch {
                    return Number(item);
                }
            };

            const sedeId = getId(storedSede);
            const orgId = getId(storedOrg);

            let params: { sede?: number; organization?: number } = {};

            if (sedeId && !isNaN(sedeId)) {
                params.sede = sedeId;
            } else if (orgId && !isNaN(orgId)) {
                params.organization = orgId;
            }

            const data = await catalogService.getAllCatalogs(params);
            setCatalogs(data);
        } catch (error) {
            console.error('Error fetching catalogs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await catalogService.deleteCatalog(id);
            setCatalogs(catalogs.filter(c => c.id !== id));
            setShowDeleteModal(null);
        } catch (error) {
            console.error('Failed to delete catalog', error);
        }
    };

    const handleTogglePublic = async (catalog: Catalog) => {
        try {
            // Optimistic update
            const updatedCatalogs = catalogs.map(c =>
                c.id === catalog.id ? { ...c, is_public: !c.is_public } : c
            );
            setCatalogs(updatedCatalogs);

            await catalogService.updateCatalog(catalog.id, { is_public: !catalog.is_public });
        } catch (error) {
            console.error('Error updating catalog visibility:', error);
            // Revert on error
            loadCatalogs();
        }
    };

    const filteredCatalogs = catalogs.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex">
            <Sidebar />
            <div className="flex-1 ml-16">
                <Header />
                <main className="p-8 pt-24">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Meus Catálogos</h1>
                                <p className="text-zinc-500 dark:text-zinc-400">Gerencie todos os seus catálogos digitais</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-100 w-full md:w-64 transition-all"
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setShowImportModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 dark:bg-zinc-800 text-zinc-100 dark:text-zinc-100 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-700 transition-colors font-medium text-sm cursor-pointer border border-zinc-700 dark:border-zinc-700"
                                    >
                                        <Upload className="h-4 w-4" />
                                        Importar
                                    </button>
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors font-medium text-sm cursor-pointer"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Novo Catálogo
                                    </button>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="min-h-[600px] flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                            </div>
                        ) : filteredCatalogs.length === 0 ? (
                            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
                                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <BookOpen className="h-8 w-8 text-zinc-400" />
                                </div>
                                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">Nenhum catálogo encontrado</h3>
                                <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm mx-auto">
                                    {searchTerm ? 'Tente buscar com outros termos.' : 'Comece criando seu primeiro catálogo digital agora mesmo.'}
                                </p>
                                {!searchTerm && (
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors font-medium text-sm"
                                    >
                                        Criar Catálogo
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto max-h-[calc(100vh-300px)] overflow-y-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
                                            <tr>
                                                <th className="px-6 py-4 font-medium text-zinc-700 dark:text-zinc-300">Catálogo</th>
                                                <th className="px-6 py-4 font-medium text-zinc-700 dark:text-zinc-300">Status</th>
                                                <th className="px-6 py-4 font-medium text-zinc-700 dark:text-zinc-300">Explorer</th>
                                                <th className="px-6 py-4 font-medium text-zinc-700 dark:text-zinc-300">Criado em</th>
                                                <th className="px-6 py-4 font-medium text-zinc-700 dark:text-zinc-300 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                            {filteredCatalogs.map((catalog) => (
                                                <tr key={catalog.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-16 bg-zinc-200 dark:bg-zinc-800 rounded flex-shrink-0 overflow-hidden relative border border-zinc-200 dark:border-zinc-700">
                                                                <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                                                                    <BookOpen className="w-6 h-6 text-zinc-300" />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="font-medium text-zinc-900 dark:text-zinc-100 text-base">{catalog.title}</div>
                                                                    {activeSedeId && catalog.sede && catalog.sede !== activeSedeId && (
                                                                        <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full text-[10px] font-medium border border-blue-200 dark:border-blue-800">
                                                                            <Share2 className="h-3 w-3" />
                                                                            Sede #{catalog.sede}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5 line-clamp-1 max-w-[200px]">
                                                                    {catalog.description || 'Sem descrição'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                                                            Ativo
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                                            <button
                                                                onClick={() => handleTogglePublic(catalog)}
                                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 cursor-pointer ${catalog.is_public ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                                                                title={catalog.is_public ? "Remover do Explorer" : "Compartilhar no Explorer"}
                                                            >
                                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${catalog.is_public ? 'translate-x-6' : 'translate-x-1'}`} />
                                                            </button>
                                                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                                                {catalog.is_public ? 'Visível' : 'Oculto'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4" />
                                                            {new Date(catalog.created_at).toLocaleDateString('pt-BR')}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                            <button
                                                                onClick={() => window.open(`/catalogs/${catalog.id}/view`, '_blank')}
                                                                title="Visualizar"
                                                                className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleOpenEditor(catalog)}
                                                                title="Editar Conteúdo"
                                                                className="p-2 text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors cursor-pointer"
                                                            >
                                                                <LayoutTemplate className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingCatalog(catalog)}
                                                                title="Editar Informações"
                                                                className="p-2 text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors cursor-pointer"
                                                            >
                                                                <FileEdit className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setShowDeleteModal(catalog.id)}
                                                                title="Excluir"
                                                                className="p-2 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Create Catalog Modal */}
            <CreateCatalogModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => loadCatalogs()}
            />

            {/* Edit Catalog Modal */}
            <EditCatalogModal
                isOpen={!!editingCatalog}
                onClose={() => setEditingCatalog(null)}
                onSuccess={() => loadCatalogs()}
                catalog={editingCatalog}
            />

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">Excluir Catálogo?</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                            Esta ação não pode ser desfeita. O catálogo será removido permanentemente.
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(null)}
                                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-medium text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDelete(showDeleteModal)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                            >
                                Confirmar Exclusão
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            <ImportCatalogModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
            />
        </div>
    );
};
