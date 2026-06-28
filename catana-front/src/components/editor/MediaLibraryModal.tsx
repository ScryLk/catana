import { logger } from '../../utils/logger';
import { type FC, useState, useEffect } from 'react';
import { FiImage, FiUpload, FiLink, FiCheck, FiFolder, FiHome, FiSearch, FiRefreshCw, FiX } from 'react-icons/fi';
import { mediaService } from '../../services/mediaService';
import type { Media, MediaFolder } from '../../types/api';
import { useAssetStore } from '../../store/assetStore';

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
}

export const MediaLibraryModal: FC<MediaLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'upload' | 'url'>('library');
  const [imageUrl, setImageUrl] = useState('');
  const [mediaImages, setMediaImages] = useState<Media[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { assets } = useAssetStore();

  const imageAssets = assets.filter(asset => asset.type === 'image');

  const loadMediaImages = async () => {
    try {
      setLoadingMedia(true);
      setLoadError(null);
      logger.debug('[MediaLibraryModal] Carregando imagens do /media...');

      const images = await mediaService.getImagesForEditor({
        folder: currentFolder || undefined,
        search: searchTerm || undefined,
        limit: 50,
      });

      logger.debug('[MediaLibraryModal] Imagens carregadas:', images);
      setMediaImages(images);
    } catch (error: any) {
      console.error('[MediaLibraryModal] Erro ao carregar imagens:', error);

      if (error.response?.status === 401) {
        setLoadError('Você precisa estar autenticado.');
      } else if (error.response?.status === 403) {
        setLoadError('Sem permissão de acesso.');
      } else if (error.code === 'ERR_NETWORK') {
        setLoadError('Erro de conexão.');
      } else {
        setLoadError('Erro ao carregar imagens.');
      }
      setMediaImages([]);
    } finally {
      setLoadingMedia(false);
    }
  };

  const loadFolders = async () => {
    try {
      const allFolders = await mediaService.getFolders();
      const currentFolders = allFolders.filter(f => f.parent === currentFolder);
      setFolders(currentFolders);
    } catch (error) {
      console.error('[MediaLibraryModal] Erro ao carregar pastas:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert('Formato não suportado. Use PNG, JPG ou JPEG.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Arquivo muito grande. Máximo 10MB.');
      return;
    }

    try {
      setUploading(true);
      const uploadedMedia = await mediaService.uploadMedia({
        file,
        name: file.name,
        folder: currentFolder || undefined,
      });

      onSelect(uploadedMedia.file_url);
      onClose();
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload da imagem.');
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (imageUrl.trim()) {
      onSelect(imageUrl);
      setImageUrl('');
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'library') {
      loadMediaImages();
      loadFolders();
    }
  }, [isOpen, activeTab, currentFolder, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500 px-6 py-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiImage className="w-6 h-6" />
            Biblioteca de Mídia
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex">
            <button
              onClick={() => setActiveTab('library')}
              className={`flex-1 px-6 py-3.5 text-sm font-semibold transition-all ${activeTab === 'library'
                ? 'bg-white text-primary-600 border-b-3 border-primary-600 shadow-soft'
                : 'text-gray-600 hover:text-primary-600 hover:bg-white/50'
                }`}
            >
              <FiImage className="w-4 h-4 inline-block mr-2" />
              Biblioteca
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 px-6 py-3.5 text-sm font-semibold transition-all ${activeTab === 'upload'
                ? 'bg-white text-primary-600 border-b-3 border-primary-600 shadow-soft'
                : 'text-gray-600 hover:text-primary-600 hover:bg-white/50'
                }`}
            >
              <FiUpload className="w-4 h-4 inline-block mr-2" />
              Fazer Upload
            </button>
            <button
              onClick={() => setActiveTab('url')}
              className={`flex-1 px-6 py-3.5 text-sm font-semibold transition-all ${activeTab === 'url'
                ? 'bg-white text-primary-600 border-b-3 border-primary-600 shadow-soft'
                : 'text-gray-600 hover:text-primary-600 hover:bg-white/50'
                }`}
            >
              <FiLink className="w-4 h-4 inline-block mr-2" />
              Link da Internet
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
          {activeTab === 'library' && (
            <div className="space-y-4">
              {/* Busca e navegação */}
              <div className="space-y-3">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar imagens..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-12 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
                  />
                  <button
                    onClick={loadMediaImages}
                    disabled={loadingMedia}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <FiRefreshCw className={`h-4 w-4 text-gray-500 ${loadingMedia ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {currentFolder !== null && (
                  <div className="flex items-center gap-2 text-sm">
                    <button
                      onClick={() => setCurrentFolder(null)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <FiHome className="w-3 h-3" />
                      Raiz
                    </button>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-700 font-medium">Pasta {currentFolder}</span>
                  </div>
                )}
              </div>

              {loadingMedia ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                  <p className="text-gray-600 text-sm mt-4">Carregando imagens...</p>
                </div>
              ) : loadError ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FiX className="w-10 h-10 text-red-600" />
                  </div>
                  <p className="text-red-700 font-medium mb-2">Erro ao carregar imagens</p>
                  <p className="text-sm text-red-600 mb-4">{loadError}</p>
                  <button
                    onClick={loadMediaImages}
                    className="px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl hover:from-primary-600 hover:to-accent-600 transition-all shadow-soft"
                  >
                    Tentar Novamente
                  </button>
                </div>
              ) : folders.length === 0 && imageAssets.length === 0 && mediaImages.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FiImage className="w-10 h-10 text-primary-500" />
                  </div>
                  <p className="text-gray-700 font-medium">Nenhuma imagem encontrada</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Pastas */}
                  {folders.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <FiFolder className="w-4 h-4" />
                        Pastas ({folders.length})
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        {folders.map((folder) => (
                          <button
                            key={folder.id}
                            onClick={() => setCurrentFolder(folder.id)}
                            className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-primary-50 to-accent-50 border-2 border-gray-200 transition-all hover:border-primary-500 hover:shadow-medium group p-4 flex flex-col items-center justify-center gap-2"
                          >
                            <FiFolder className="w-12 h-12 text-primary-600 group-hover:scale-110 transition-transform" />
                            <p className="text-sm font-medium text-gray-700 truncate w-full text-center">{folder.name}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Imagens da API */}
                  {mediaImages.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <FiImage className="w-4 h-4" />
                        Imagens ({mediaImages.length})
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        {mediaImages.map((media) => (
                          <button
                            key={media.id}
                            onClick={() => {
                              onSelect(media.file_url);
                              onClose();
                            }}
                            className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200 transition-all hover:border-primary-500 hover:shadow-medium group"
                          >
                            <img
                              src={media.file_url}
                              alt={media.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Erro';
                              }}
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-3">
                              <p className="text-white text-xs font-medium truncate">{media.name}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Imagens Locais */}
                  {imageAssets.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">
                        Imagens Locais ({imageAssets.length})
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        {imageAssets.map((asset) => (
                          <button
                            key={asset.id}
                            onClick={() => {
                              onSelect(asset.url);
                              onClose();
                            }}
                            className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200 transition-all hover:border-primary-500 hover:shadow-medium group"
                          >
                            <img
                              src={asset.url}
                              alt={asset.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-3">
                              <p className="text-white text-xs font-medium truncate">{asset.name}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div>
              {uploading ? (
                <div className="flex flex-col items-center justify-center h-72">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mb-4"></div>
                  <p className="text-lg font-semibold text-gray-700">Enviando imagem...</p>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-72 border-3 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-primary-500 hover:bg-gradient-to-br hover:from-primary-50 hover:to-accent-50 transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FiUpload className="w-10 h-10 text-primary-600 mb-4 group-hover:scale-110 transition-transform" />
                    <p className="mb-2 text-base text-gray-700">
                      <span className="font-bold">Clique para fazer upload</span>
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 10MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
          )}

          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2.5">
                  <FiLink className="w-4 h-4 text-primary-600" />
                  Cole a URL da imagem
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                />
              </div>

              {imageUrl && (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Erro';
                    }}
                  />
                </div>
              )}

              <button
                onClick={handleUrlSubmit}
                disabled={!imageUrl.trim()}
                className="w-full bg-gradient-to-r from-primary-500 to-accent-500 text-white px-6 py-3.5 rounded-xl hover:from-primary-600 hover:to-accent-600 disabled:opacity-50 transition-all font-semibold shadow-soft flex items-center justify-center gap-2"
              >
                <FiCheck className="w-5 h-5" />
                Usar esta imagem
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
