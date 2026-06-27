import { type FC } from 'react';
import { FiFolder, FiPackage } from 'react-icons/fi';
import { usePanelContext } from '../../contexts/PanelContext';

export const MinimizedPanelTabs: FC = () => {
  const { minimizedPanels, togglePanel } = usePanelContext();

  const tabs = [
    {
      id: 'components' as const,
      label: 'Componentes',
      icon: FiPackage,
      color: 'from-primary-500 to-primary-600',
      isMinimized: minimizedPanels.components,
    },
    {
      id: 'groups' as const,
      label: 'Grupos',
      icon: FiFolder,
      color: 'from-primary-500 to-primary-600',
      isMinimized: minimizedPanels.groups,
    },
  ];

  const visibleTabs = tabs.filter((tab) => tab.isMinimized);

  if (visibleTabs.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 flex gap-2 z-50">
      {visibleTabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => togglePanel(tab.id)}
            className={`bg-gradient-to-r ${tab.color} text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group`}
            title={`Restaurar ${tab.label}`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
