import { type FC, useRef, useState } from 'react';
import { FiUpload, FiX, FiChevronDown, FiImage } from 'react-icons/fi';
import { useAssetStore } from '../../store/assetStore';
import { MediaLibraryModal } from './MediaLibraryModal';

export const ImageUploadSection: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { assets, addAsset, addAssetByUrl, removeAsset } = useAssetStore();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          await addAsset(file);
        }
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Erro ao fazer upload das imagens');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLibrarySelect = async (imageUrl: string) => {
    try {
      // Extrair nome do arquivo da URL ou usar genérico
      const fileName = imageUrl.split('/').pop() || 'Imagem da Biblioteca';
      await addAssetByUrl(imageUrl, fileName);
    } catch (error) {
      console.error('Error adding image from library:', error);
      alert('Erro ao adicionar imagem da biblioteca');
    }
  };

  const handleDragStart = (e: React.DragEvent, assetId: string) => {
    e.dataTransfer.setData('componentType', 'uploaded-image');
    e.dataTransfer.setData('assetId', assetId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return ''; // Tamanho desconhecido
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📸</span>
          <span className="font-semibold text-gray-900">Minhas Imagens</span>
          {assets.length > 0 && (
            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-bold rounded-full">
              {assets.length}
            </span>
          )}
        </div>
        <FiChevronDown
          className={`w-5 h-5 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="p-2 bg-gray-50">
          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 flex flex-col items-center gap-1"
            >
              <FiUpload className="w-5 h-5 text-primary-600" />
              <span className="text-xs font-medium text-gray-700">Upload</span>
            </button>
            <button
              onClick={() => setShowLibrary(true)}
              className="p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors flex flex-col items-center gap-1"
            >
              <FiImage className="w-5 h-5 text-primary-600" />
              <span className="text-xs font-medium text-gray-700">Biblioteca</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Images Grid */}
          {assets.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, asset.id)}
                  className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden cursor-move hover:border-primary-500 hover:shadow-md transition-all"
                >
                  {/* Image Preview */}
                  <div className="aspect-square bg-gray-100 relative">
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                    />

                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Remover esta imagem?')) {
                          removeAsset(asset.id);
                        }
                      }}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FiX className="w-3 h-3" />
                    </button>

                    {/* Drag Hint */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">
                        Arrastar
                      </span>
                    </div>
                  </div>

                  {/* Image Info */}
                  <div className="p-2 bg-gray-50">
                    <div className="text-xs font-medium text-gray-900 truncate" title={asset.name}>
                      {asset.name}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center justify-between mt-1">
                      <span>{asset.width}×{asset.height}</span>
                      <span>{formatFileSize(asset.size)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              Nenhuma imagem enviada
            </div>
          )}
        </div>
      )}

      <MediaLibraryModal
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        onSelect={handleLibrarySelect}
      />
    </div>
  );
};
