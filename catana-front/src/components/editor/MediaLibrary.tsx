import { logger } from '../../utils/logger';
import { type FC, useState, useRef, type DragEvent, useEffect } from 'react';
import { useAssetStore } from '../../store/assetStore';
import { mediaService } from '../../services/mediaService';
import type { Media } from '../../types/api';
import { FiUpload, FiX, FiSearch, FiTrash2, FiImage, FiCheck, FiRefreshCw } from 'react-icons/fi';

interface MediaLibraryProps {
  onSelect?: (assetId: string) => void;
  onClose?: () => void;
  selectionMode?: boolean;
}

export const MediaLibrary: FC<MediaLibraryProps> = ({ onSelect, onClose, selectionMode = false }) => {
  logger.debug('[MediaLibrary] Componente montado');
  const { assets, addAsset, removeAsset } = useAssetStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [apiImages, setApiImages] = useState<Media[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtrar assets locais
  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtrar imagens da API
  const filteredApiImages = apiImages.filter(img =>
    img.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Carregar imagens da API
  const loadApiImages = async () => {
    try {
      setIsLoadingApi(true);
      setLoadError(null);
      logger.debug('[MediaLibrary] Carregando imagens da API /media...');

      const images = await mediaService.getMedia({
        media_type: 'image',
      });

      logger.debug('[MediaLibrary] Imagens da API carregadas:', images);
      setApiImages(images);
    } catch (error: any) {
      console.error('[MediaLibrary] Erro ao carregar imagens da API:', error);
      console.error('[MediaLibrary] Response:', error.response?.data);
      console.error('[MediaLibrary] Status:', error.response?.status);

      if (error.response?.status === 401) {
        setLoadError('Você precisa estar autenticado. Redirecionando...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      } else if (error.code === 'ERR_NETWORK') {
        setLoadError('Erro de conexão. Verifique se o backend está rodando.');
      } else {
        setLoadError(error.response?.data?.detail || error.message || 'Erro ao carregar imagens.');
      }
      setApiImages([]);
    } finally {
      setIsLoadingApi(false);
    }
  };

  // Carregar imagens ao montar o componente
  useEffect(() => {
    logger.debug('[MediaLibrary] useEffect executado, carregando imagens...');
    loadApiImages();
  }, []);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      logger.debug('[MediaLibrary] Fazendo upload de', files.length, 'arquivo(s)...');

      // Upload para localStorage (local)
      const localPromises = Array.from(files).map(file => addAsset(file));

      // Upload para API
      const apiPromises = Array.from(files).map(async (file) => {
        try {
          const uploaded = await mediaService.uploadMedia({
            file,
            name: file.name,
          });
          logger.debug('[MediaLibrary] Upload para API concluído:', uploaded);
          return uploaded;
        } catch (error) {
          console.error('[MediaLibrary] Erro no upload para API:', error);
          // Não falhar se o upload da API falhar, continuar com localStorage
          return null;
        }
      });

      await Promise.all([...localPromises, ...apiPromises]);

      // Recarregar imagens da API
      await loadApiImages();
    } catch (error) {
      console.error('[MediaLibrary] Erro ao fazer upload:', error);
      alert('Erro ao fazer upload de alguns arquivos. Por favor, tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleAssetClick = (assetId: string) => {
    if (selectionMode) {
      setSelectedAssetId(assetId);
    }
  };

  const handleConfirmSelection = () => {
    logger.debug('[MediaLibrary] Confirmando seleção:', selectedAssetId);
    if (selectedAssetId && onSelect) {
      logger.debug('[MediaLibrary] Chamando onSelect com:', selectedAssetId);
      onSelect(selectedAssetId);
    } else {
      console.warn('[MediaLibrary] Não há imagem selecionada ou callback onSelect');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
              <FiImage className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Biblioteca de Mídia</h2>
              <p className="text-xs text-gray-400">
                {apiImages.length} {apiImages.length === 1 ? 'imagem disponível' : 'imagens disponíveis'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadApiImages}
              disabled={isLoadingApi}
              className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              title="Recarregar imagens"
            >
              <FiRefreshCw size={20} className={isLoadingApi ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>

        {/* Search and Upload */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-700">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar imagens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiUpload size={18} />
            {isUploading ? 'Enviando...' : 'Enviar Imagens'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoadingApi ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mb-4"></div>
              <p className="text-gray-400">Carregando imagens...</p>
            </div>
          ) : loadError ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-red-400 mb-2">Erro ao carregar imagens</h3>
              <p className="text-sm text-gray-400 mb-4">{loadError}</p>
              <button
                onClick={loadApiImages}
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white rounded-lg font-medium transition-all"
              >
                Tentar Novamente
              </button>
            </div>
          ) : apiImages.length === 0 && assets.length === 0 ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                h-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-colors cursor-pointer
                ${isDragging
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                }
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-2xl flex items-center justify-center mb-4">
                <FiUpload className="text-primary-400" size={40} />
              </div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">
                {isDragging ? 'Solte os arquivos aqui' : 'Nenhuma imagem enviada'}
              </h3>
              <p className="text-sm text-gray-500 text-center max-w-md">
                Arraste e solte imagens aqui ou clique no botão "Enviar Imagens" para começar
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Formatos suportados: JPG, PNG, GIF, WebP
              </p>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                min-h-full transition-colors rounded-xl
                ${isDragging ? 'bg-primary-500/10 border-2 border-dashed border-primary-500' : ''}
              `}
            >
              {filteredApiImages.length === 0 && filteredAssets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-12">
                  <FiSearch className="text-gray-600 mb-4" size={48} />
                  <p className="text-gray-500">Nenhuma imagem encontrada{searchTerm ? ` para "${searchTerm}"` : ''}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {/* Imagens da API */}
                  {filteredApiImages.map((media) => (
                    <div
                      key={`api-${media.id}`}
                      onClick={() => {
                        logger.debug('[MediaLibrary] Imagem da API clicada:', media.file_url);
                        if (selectionMode) {
                          setSelectedAssetId(media.file_url);
                        } else if (onSelect) {
                          onSelect(media.file_url);
                        }
                      }}
                      className={`
                        group relative bg-gray-800 rounded-xl overflow-hidden cursor-pointer transition-all duration-200
                        ${selectionMode && selectedAssetId === media.file_url
                          ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-gray-900 scale-95'
                          : 'hover:scale-105 hover:shadow-xl'
                        }
                      `}
                    >
                      {/* Image */}
                      <div className="aspect-square bg-gray-900 relative">
                        <img
                          src={media.file_url}
                          alt={media.name}
                          className="w-full h-full object-cover"
                        />
                        {selectionMode && selectedAssetId === media.file_url && (
                          <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
                            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                              <FiCheck className="text-white" size={18} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Info Overlay */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                        <p className="text-xs font-medium text-white truncate mb-1">{media.name}</p>
                        <div className="flex items-center justify-between text-xs text-gray-300">
                          <span className="text-green-400">API</span>
                          <span>{media.file_size_formatted}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Imagens Locais (localStorage) */}
                  {filteredAssets.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => handleAssetClick(asset.id)}
                      className={`
                        group relative bg-gray-800 rounded-xl overflow-hidden cursor-pointer transition-all duration-200
                        ${selectionMode && selectedAssetId === asset.id
                          ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-gray-900 scale-95'
                          : 'hover:scale-105 hover:shadow-xl'
                        }
                      `}
                    >
                      {/* Image */}
                      <div className="aspect-square bg-gray-900 relative">
                        <img
                          src={asset.url}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                        />
                        {selectionMode && selectedAssetId === asset.id && (
                          <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
                            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                              <FiCheck className="text-white" size={18} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Info Overlay */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                        <p className="text-xs font-medium text-white truncate mb-1">{asset.name}</p>
                        <div className="flex items-center justify-between text-xs text-gray-300">
                          <span className="text-blue-400">Local</span>
                          <span>{formatFileSize(asset.size)}</span>
                        </div>
                      </div>

                      {/* Delete Button */}
                      {!selectionMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Deseja realmente excluir esta imagem?')) {
                              removeAsset(asset.id);
                            }
                          }}
                          className="absolute top-2 right-2 p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          title="Excluir"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer (quando em modo de seleção) */}
        {selectionMode && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700 bg-gray-900/50">
            <p className="text-sm text-gray-400">
              {selectedAssetId ? 'Imagem selecionada' : 'Selecione uma imagem para continuar'}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSelection}
                disabled={!selectedAssetId}
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Usar Imagem
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
