import { type FC, useState } from 'react';

interface ProductCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (count: number) => void;
}

export const ProductCountModal: FC<ProductCountModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [count, setCount] = useState(20);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (count > 0 && count <= 20) {
      onConfirm(count);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
            <span className="text-2xl">📦</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Mostruário de Produtos</h2>
            <p className="text-sm text-gray-500">Escolha quantos produtos exibir</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quantidade de Produtos
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={count}
              onChange={(e) => setCount(Math.min(20, parseInt(e.target.value) || 1))}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-full px-4 py-3 text-lg font-bold text-center border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 outline-none transition-all"
            />
            <p className="mt-2 text-xs text-gray-500 text-center">
              Mínimo: 1 produto • Máximo: 20 produtos
            </p>
          </div>

          {/* Quick buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[8, 12, 16, 20].map((num) => (
              <button
                key={num}
                onClick={() => setCount(num)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${count === num
                    ? 'bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {num}
              </button>
            ))}
          </div>

          {/* Preview */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Preview do Layout ({count} {count === 1 ? 'produto' : 'produtos'})
            </p>
            <div className="grid grid-cols-2 gap-1">
              {Array.from({ length: Math.min(count, 12) }).map((_, i) => (
                <div
                  key={i}
                  className="h-6 bg-gradient-to-br from-orange-400/20 to-amber-500/20 rounded border border-orange-500/30 flex items-center gap-1 px-1"
                >
                  <div className="w-5 h-5 bg-orange-500/20 rounded-sm flex items-center justify-center flex-shrink-0">
                    <span className="text-[8px] text-gray-400">📦</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="h-1 bg-gray-300/50 rounded mb-0.5"></div>
                    <div className="h-1 bg-gray-300/30 rounded w-2/3"></div>
                  </div>
                  <span className="text-[8px] font-bold text-gray-400">{i + 1}</span>
                </div>
              ))}
              {count > 12 && (
                <div className="h-6 bg-gradient-to-br from-orange-400/40 to-amber-500/40 rounded border border-orange-500/50 col-span-2 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-orange-600">+{count - 12} produtos</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-6 py-3 bg-gradient-to-br from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
};
