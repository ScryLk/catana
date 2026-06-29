import { type FC, useState, useRef } from 'react';
import { FiUpload, FiX, FiAlertCircle, FiCheckCircle, FiFile, FiLayers } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import {
  readCatalogFile,
  validateCatalogSchema,
  generateImportPreview,
} from '../../services/catalogIO.service';
import { catalogService } from '../../services/catalogService';
import type { CatalogExportSchema, ImportPreview } from '../../types/catalogIO';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type ImportState = 'idle' | 'reading' | 'preview' | 'importing' | 'success' | 'error';

export const ImportCatalogModal: FC<Props> = ({ isOpen, onClose }) => {
  const [state, setState] = useState<ImportState>('idle');
  const [schema, setSchema] = useState<CatalogExportSchema | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileSelect = async (file: File) => {
    setState('reading');
    setError(null);

    try {
      // Ler arquivo
      const data = await readCatalogFile(file);

      // Validar schema
      const validation = validateCatalogSchema(data);

      if (!validation.valid) {
        const errorMessages = validation.errors
          .map((e) => e.message)
          .join(', ');
        throw new Error(errorMessages);
      }

      // Gerar preview
      const previewData = generateImportPreview(data);

      setSchema(data);
      setPreview(previewData);
      setState('preview');
    } catch (err: any) {
      setError(err.message || 'Erro ao ler arquivo JSON');
      setState('error');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];

    if (file && file.type === 'application/json') {
      handleFileSelect(file);
    } else {
      setError('Por favor, selecione um arquivo JSON válido');
      setState('error');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleConfirmImport = async () => {
    if (!schema) return;

    setState('importing');

    try {
      // Ingest no backend: materializa Page/PageComponent/Component/Theme
      // (inverso do catalogLoader), deixando o catálogo persistido e editável.
      const result = await catalogService.importJson(schema);

      setState('success');

      // Abre o catálogo recém-criado; o editor o carrega do backend.
      setTimeout(() => {
        onClose();
        resetState();
        navigate(`/editor?catalog=${result.catalog_id}`, {
          state: { catalogId: result.catalog_id },
        });
      }, 1200);
    } catch (err: unknown) {
      const apiError = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error;
      const message = err instanceof Error ? err.message : undefined;
      setError(apiError || message || 'Erro ao importar catálogo');
      setState('error');
    }
  };

  const resetState = () => {
    setState('idle');
    setSchema(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    onClose();
    resetState();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <FiUpload className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Importar Catálogo
              </h2>
              <p className="text-sm text-gray-500">
                Carregue um arquivo JSON de catálogo
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* IDLE STATE - Upload Area */}
          {state === 'idle' && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary-500 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <FiUpload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Arraste um arquivo JSON aqui
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                ou clique para selecionar
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}

          {/* READING STATE */}
          {state === 'reading' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Lendo arquivo...</p>
            </div>
          )}

          {/* PREVIEW STATE */}
          {state === 'preview' && preview && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 mb-1">
                      Arquivo válido
                    </h4>
                    <p className="text-sm text-blue-700">
                      O catálogo pode ser importado com segurança
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <FiFile className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Nome do catálogo</p>
                    <p className="font-medium text-gray-900">
                      {preview.catalogName}
                    </p>
                  </div>
                </div>

                {preview.description && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Descrição</p>
                    <p className="text-gray-900">{preview.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Páginas</p>
                    <div className="flex items-center gap-2">
                      <FiLayers className="w-5 h-5 text-gray-600" />
                      <p className="text-2xl font-semibold text-gray-900">
                        {preview.pageCount}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Elementos</p>
                    <div className="flex items-center gap-2">
                      <FiLayers className="w-5 h-5 text-gray-600" />
                      <p className="text-2xl font-semibold text-gray-900">
                        {preview.elementCount}
                      </p>
                    </div>
                  </div>
                </div>

                {(preview.organization || preview.sede) && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-2">Origem</p>
                    {preview.organization && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Organização:</span>{' '}
                        {preview.organization}
                      </p>
                    )}
                    {preview.sede && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Sede:</span> {preview.sede}
                      </p>
                    )}
                  </div>
                )}

                {preview.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FiAlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-yellow-900 mb-2">
                          Avisos
                        </h4>
                        <ul className="space-y-1">
                          {preview.warnings.map((warning, index) => (
                            <li
                              key={index}
                              className="text-sm text-yellow-700"
                            >
                              {warning.message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={resetState}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Importar Catálogo
                </button>
              </div>
            </div>
          )}

          {/* IMPORTING STATE */}
          {state === 'importing' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Importando catálogo...</p>
            </div>
          )}

          {/* SUCCESS STATE */}
          {state === 'success' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Catálogo importado com sucesso!
              </h3>
              <p className="text-sm text-gray-500">
                Redirecionando para o editor...
              </p>
            </div>
          )}

          {/* ERROR STATE */}
          {state === 'error' && (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FiAlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-900 mb-1">
                      Erro ao importar
                    </h4>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={resetState}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
