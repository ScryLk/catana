import { type FC, useState } from 'react';
import { FiX, FiSave } from 'react-icons/fi';
import { useComponentStore } from '../../store/componentStore';
import { useEditorStore } from '../../store/editorStore';
import type { CustomComponent } from '../../store/componentStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SaveComponentModal: FC<Props> = ({ isOpen, onClose }) => {
  const { addComponent } = useComponentStore();
  const { selectedElementIds, getCurrentPage } = useEditorStore();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CustomComponent['category']>('section');

  if (!isOpen) return null;

  const currentPage = getCurrentPage();
  const selectedElements = currentPage?.elements.filter((el) => selectedElementIds.includes(el.id)) || [];

  const categories: { value: CustomComponent['category']; label: string; icon: string }[] = [
    { value: 'header', label: 'Cabeçalho', icon: '📄' },
    { value: 'footer', label: 'Rodapé', icon: '📋' },
    { value: 'section', label: 'Seção', icon: '📦' },
    { value: 'card', label: 'Card', icon: '🎴' },
    { value: 'other', label: 'Outro', icon: '🔧' },
  ];

  const handleSave = () => {
    if (!name.trim()) {
      alert('Por favor, insira um nome para o componente');
      return;
    }

    if (selectedElements.length === 0) {
      alert('Nenhum elemento selecionado');
      return;
    }

    // Remove pageId and id from elements
    const elements = selectedElements.map(({ id, pageId, ...rest }) => rest);

    addComponent({
      name: name.trim(),
      category,
      elements,
    });

    setName('');
    setCategory('section');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Salvar como Componente</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Componente
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Cabeçalho Principal"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${category === cat.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="font-medium text-sm">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>{selectedElements.length}</strong> elemento(s) selecionado(s) será(ão) salvo(s)
              como componente reutilizável.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <FiSave className="w-4 h-4" />
            Salvar Componente
          </button>
        </div>
      </div>
    </div>
  );
};
