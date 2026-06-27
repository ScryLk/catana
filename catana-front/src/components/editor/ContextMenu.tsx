import { type FC, useEffect, useRef } from 'react';

interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onClick: () => void;
  separator?: boolean;
  disabled?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

export const ContextMenu: FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust menu position to keep it within viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (rect.right > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 8;
      }

      if (rect.bottom > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 8;
      }

      menuRef.current.style.left = `${Math.max(8, adjustedX)}px`;
      menuRef.current.style.top = `${Math.max(8, adjustedY)}px`;
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[220px] bg-[#2C2C2C] rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-gray-700/30 py-1.5 text-sm"
      style={{ left: x, top: y }}
    >
      {items.map((item, index) => (
        <div key={index}>
          {item.separator && index > 0 && (
            <div className="h-px bg-gray-600/30 my-1.5 mx-2" />
          )}
          <button
            onClick={() => {
              if (!item.disabled) {
                item.onClick();
                onClose();
              }
            }}
            disabled={item.disabled}
            className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-all ${item.disabled
                ? 'opacity-40 cursor-not-allowed text-gray-500'
                : 'text-white/95 hover:bg-blue-600/80 hover:text-white cursor-pointer'
              }`}
          >
            <div className="flex items-center gap-3">
              {item.icon && <span className="text-lg opacity-90">{item.icon}</span>}
              <span className="font-medium tracking-tight">{item.label}</span>
            </div>
            {item.shortcut && (
              <span className="text-xs text-gray-400 font-mono ml-6 tracking-wide">{item.shortcut}</span>
            )}
          </button>
        </div>
      ))}
    </div>
  );
};
