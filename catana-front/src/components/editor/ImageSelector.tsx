import { type FC, useState, useEffect } from 'react';
import { FiImage, FiUpload, FiLink, FiCheck, FiFolder, FiHome, FiSearch, FiRefreshCw } from 'react-icons/fi';
import { useAssetStore } from '../../store/assetStore';
import { mediaService } from '../../services/mediaService';
import type { Media, MediaFolder } from '../../types/api';

interface ImageSelectorProps {
  currentImage?: string;
  onImageSelect: (imageUrl: string) => void;
  label?: string;
}

export const ImageSelector: FC<ImageSelectorProps> = ({
  currentImage,
  onImageSelect,
  label = 'Imagem',
}) => {
  import.meta.env.DEV && console.log('[ImageSelector] Componente montado');
  const [showModal, setShowModal] = useState(false);
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
      import.meta.env.DEV && console.log('[ImageSelector] Carregando imagens do /media...');

      // Usar endpoint otimizado para o editor
      const images = await mediaService.getImagesForEditor({
        folder: currentFolder || undefined,
        search: searchTerm || undefined,
        limit: 50, // Carregar mais imagens por vez
      });

      import.meta.env.DEV && console.log('[ImageSelector] Imagens carregadas:', images);
      setMediaImages(images);
    } catch (error: any) {
      console.error('[ImageSelector] Erro ao carregar imagens:', error);
      console.error('[ImageSelector] Response:', error.response?.data);
      console.error('[ImageSelector] Status:', error.response?.status);

      // Definir mensagem de erro amigável
      if (error.response?.status === 401) {
        setLoadError('Você precisa estar autenticado. Redirecionando...');
        console.warn('[ImageSelector] Erro 401 - redirecionando para login');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      } else if (error.response?.status === 403) {
        setLoadError('Você não tem permissão para acessar a biblioteca de mídia.');
      } else if (error.code === 'ERR_NETWORK') {
        setLoadError('Erro de conexão. Verifique se o backend está rodando.');
      } else {
        setLoadError(error.response?.data?.detail || error.message || 'Erro ao carregar imagens.');
      }
      setMediaImages([]);
    } finally {
      setLoadingMedia(false);
    }
  };

  const loadFolders = async () => {
    try {
      import.meta.env.DEV && console.log('[ImageSelector] Carregando pastas...');
      const allFolders = await mediaService.getFolders();
      import.meta.env.DEV && console.log('[ImageSelector] Pastas carregadas:', allFolders);
      // Filtrar apenas pastas da pasta atual
      const currentFolders = allFolders.filter(f => f.parent === currentFolder);
      setFolders(currentFolders);
    } catch (error) {
      console.error('[ImageSelector] Erro ao carregar pastas:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert('Formato de arquivo não suportado. Por favor, envie apenas arquivos PNG, JPG ou JPEG.');
      return;
    }

    // Validar tamanho do arquivo (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB em bytes
    if (file.size > maxSize) {
      alert('Arquivo muito grande. O tamanho máximo é 10MB.');
      return;
    }

    try {
      setUploading(true);

      // Upload direto para a API
      const uploadedMedia = await mediaService.uploadMedia({
        file,
        name: file.name,
        folder: currentFolder || undefined,
      });

      // Selecionar a imagem enviada automaticamente
      onImageSelect(uploadedMedia.file_url);

      // Recarregar a lista de imagens
      await loadMediaImages();

      // Fechar o modal
      setShowModal(false);
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      alert('Erro ao fazer upload da imagem. Por favor, tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (imageUrl.trim()) {
      onImageSelect(imageUrl);
      setImageUrl('');
      setShowModal(false);
    }
  };

  // Carregar imagens quando modal abrir ou quando mudar de pasta/busca
  useEffect(() => {
    if (showModal && activeTab === 'library') {
      import.meta.env.DEV && console.log('[ImageSelector] Modal aberto, carregando dados...');
      loadMediaImages();
      loadFolders();
    }
  }, [showModal, activeTab, currentFolder, searchTerm]);

  return (
    <>
      <div>
        <label className="block text-xs text-gray-600 mb-2">{label}</label>

        {/* Current Image Preview */}
        <div className="space-y-2">
          {currentImage && (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
              <img
                src={currentImage}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Select Button */}
          <button
            onClick={() => {
              import.meta.env.DEV && console.log('[ImageSelector] Botão clicado, abrindo modal...');
              setShowModal(true);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl hover:from-primary-600 hover:to-accent-600 transition-all shadow-soft hover:shadow-medium font-medium"
          >
            <FiImage className="w-4 h-4" />
            {currentImage ? 'Trocar Imagem' : 'Selecionar Imagem'}
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>

          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500 px-6 py-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FiImage className="w-6 h-6" />
                Selecionar Imagem
              </h2>
              <button
                onClick={() => setShowModal(false)}
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
                    {/* Barra de busca */}
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
                        title="Recarregar imagens"
                      >
                        <FiRefreshCw className={`h-4 w-4 text-gray-500 ${loadingMedia ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    {/* Breadcrumb de navegação */}
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
                        <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-red-700 font-medium mb-2">Erro ao carregar imagens</p>
                      <p className="text-sm text-red-600 mb-4">{loadError}</p>
                      <button
                        onClick={loadMediaImages}
                        className="px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl hover:from-primary-600 hover:to-accent-600 transition-all shadow-soft hover:shadow-medium font-medium"
                      >
                        Tentar Novamente
                      </button>
                    </div>
                  ) : folders.length === 0 && imageAssets.length === 0 && mediaImages.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FiImage className="w-10 h-10 text-primary-500" />
                      </div>
                      <p className="text-gray-700 font-medium">Nenhuma imagem na biblioteca</p>
                      <p className="text-sm text-gray-500 mt-2">Faça upload de imagens para vê-las aqui</p>
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

                      {/* Imagens da API (Biblioteca de Mídia) */}
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
                                  onImageSelect(media.file_url);
                                  setShowModal(false);
                                }}
                                className={`relative aspect-video rounded-xl overflow-hidden bg-gray-100 border-2 transition-all hover:border-primary-500 hover:shadow-medium group ${currentImage === media.file_url ? 'border-primary-600 ring-2 ring-primary-200 shadow-soft' : 'border-gray-200'
                                  }`}
                              >
                                <img
                                  src={media.file_url}
                                  alt={media.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Erro';
                                  }}
                                />
                                {currentImage === media.file_url && (
                                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/30 to-accent-500/30 flex items-center justify-center">
                                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center shadow-strong">
                                      <FiCheck className="w-6 h-6 text-white" />
                                    </div>
                                  </div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-3">
                                  <p className="text-white text-xs font-medium truncate">{media.name}</p>
                                  <p className="text-white/80 text-[10px]">{media.file_size_formatted}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Imagens Locais (Session Storage) */}
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
                                  onImageSelect(asset.url);
                                  setShowModal(false);
                                }}
                                className={`relative aspect-video rounded-xl overflow-hidden bg-gray-100 border-2 transition-all hover:border-primary-500 hover:shadow-medium group ${currentImage === asset.url ? 'border-primary-600 ring-2 ring-primary-200 shadow-soft' : 'border-gray-200'
                                  }`}
                              >
                                <img
                                  src={asset.url}
                                  alt={asset.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                {currentImage === asset.url && (
                                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/30 to-accent-500/30 flex items-center justify-center">
                                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center shadow-strong">
                                      <FiCheck className="w-6 h-6 text-white" />
                                    </div>
                                  </div>
                                )}
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
                      <p className="text-sm text-gray-500 mt-2">Aguarde enquanto fazemos o upload</p>
                    </div>
                  ) : (
                    <>
                      <label className="flex flex-col items-center justify-center w-full h-72 border-3 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-primary-500 hover:bg-gradient-to-br hover:from-primary-50 hover:to-accent-50 transition-all group">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <FiUpload className="w-10 h-10 text-primary-600" />
                          </div>
                          <p className="mb-2 text-base text-gray-700">
                            <span className="font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">Clique para fazer upload</span>
                          </p>
                          <p className="text-sm text-gray-600 mb-1">ou arraste e solte aqui</p>
                          <p className="text-xs text-gray-500 mt-2 px-4 py-1.5 bg-gray-100 rounded-lg">PNG, JPG, JPEG (MAX. 10MB)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/png, image/jpeg, image/jpg"
                          onChange={handleFileUpload}
                          disabled={uploading}
                        />
                      </label>
                      <p className="text-xs text-gray-500 text-center mt-4">
                        As imagens enviadas ficarão disponíveis na sua biblioteca
                        {currentFolder && ' na pasta atual'}
                      </p>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'url' && (
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2.5">
                      <FiLink className="w-4 h-4 text-primary-600" />
                      Cole a URL da imagem da internet
                    </label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://exemplo.com/imagem.jpg"
                      className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && imageUrl.trim()) {
                          handleUrlSubmit();
                        }
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Exemplo: https://images.unsplash.com/photo-123456789
                    </p>
                  </div>

                  {imageUrl && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2.5">Preview:</p>
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200 shadow-soft">
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Erro+ao+carregar+imagem';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleUrlSubmit}
                    disabled={!imageUrl.trim()}
                    className="w-full bg-gradient-to-r from-primary-500 to-accent-500 text-white px-6 py-3.5 rounded-xl hover:from-primary-600 hover:to-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-soft hover:shadow-medium disabled:hover:shadow-soft flex items-center justify-center gap-2"
                  >
                    <FiCheck className="w-5 h-5" />
                    Usar esta imagem
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
