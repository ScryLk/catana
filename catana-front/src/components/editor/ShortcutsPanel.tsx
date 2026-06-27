import { type FC } from 'react';
import { FiX, FiCommand } from 'react-icons/fi';
import { type KeyboardShortcut, formatShortcut } from '../../hooks/useKeyboardShortcuts';

interface ShortcutsPanelProps {
  shortcuts: KeyboardShortcut[];
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsPanel: FC<ShortcutsPanelProps> = ({
  shortcuts,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    // Determine category based on description
    let category = 'Outros';

    if (shortcut.description.includes('Copiar') || shortcut.description.includes('Colar') ||
      shortcut.description.includes('Cortar') || shortcut.description.includes('Duplicar') ||
      shortcut.description.includes('Deletar')) {
      category = 'Edição Básica';
    } else if (shortcut.description.includes('Desfazer') || shortcut.description.includes('Refazer')) {
      category = 'Histórico';
    } else if (shortcut.description.includes('Alinhar') || shortcut.description.includes('Centralizar')) {
      category = 'Alinhamento';
    } else if (shortcut.description.includes('Agrupar') || shortcut.description.includes('Desagrupar')) {
      category = 'Agrupamento';
    } else if (shortcut.description.includes('frente') || shortcut.description.includes('trás') ||
      shortcut.description.includes('fundo')) {
      category = 'Camadas';
    } else if (shortcut.description.includes('grade') || shortcut.description.includes('snap')) {
      category = 'Grade e Snap';
    } else if (shortcut.description.includes('Salvar')) {
      category = 'Arquivo';
    } else if (shortcut.description.includes('Selecionar')) {
      category = 'Seleção';
    }

    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiCommand className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-bold text-white">Atalhos de Teclado</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <div key={category} className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 bg-white rounded hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-gray-700 text-sm">
                        {shortcut.description}
                      </span>
                      <kbd className="bg-gray-100 border border-gray-300 rounded px-2 py-1 text-xs font-mono text-gray-700 shadow-sm">
                        {formatShortcut(shortcut)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer tip */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Dica:</strong> Pressione <kbd className="bg-white border border-blue-300 rounded px-2 py-0.5 text-xs font-mono">?</kbd> a qualquer momento para ver esta lista de atalhos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Botão flutuante para abrir o painel de atalhos
 */
export const ShortcutsButton: FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 w-12 h-12 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-40"
      title="Ver atalhos de teclado (?)"
    >
      <FiCommand className="w-6 h-6" />
    </button>
  );
};
