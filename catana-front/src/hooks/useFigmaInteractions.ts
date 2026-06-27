/**
 * Hook para interações Figma-like
 * ETAPA 8: Resize
 * ETAPA 11: Atalhos de teclado
 */

import { useEffect, useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';

export const useFigmaInteractions = () => {
  const {
    selectedElementIds,
    deleteElement,
    undo,
    redo,
    groupElements,
    ungroupElements,
    updateElement,
    getCurrentPage,
    selectMultipleElements,
  } = useEditorStore();

  const currentPage = getCurrentPage();
  const elements = currentPage?.elements || [];

  // ETAPA 11: Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Delete / Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIds.length > 0) {
        e.preventDefault();
        selectedElementIds.forEach((id) => deleteElement(id));
        return;
      }

      // Esc - Cancelar seleção
      if (e.key === 'Escape') {
        e.preventDefault();
        useEditorStore.getState().setSelectedElement(null);
        return;
      }

      // Ctrl/Cmd + A - Selecionar tudo
      if (modifier && e.key === 'a') {
        e.preventDefault();
        const allIds = elements.filter((el) => !el.locked).map((el) => el.id);
        selectMultipleElements(allIds);
        return;
      }

      // Ctrl/Cmd + Z - Undo
      if (modifier && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl/Cmd + Shift + Z - Redo
      if (modifier && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        redo();
        return;
      }

      // Ctrl/Cmd + G - Agrupar
      if (modifier && e.key === 'g' && !e.shiftKey && selectedElementIds.length >= 2) {
        e.preventDefault();
        groupElements(selectedElementIds);
        return;
      }

      // Ctrl/Cmd + Shift + G - Desagrupar
      if (modifier && e.shiftKey && e.key === 'g' && selectedElementIds.length === 1) {
        e.preventDefault();
        const selected = elements.find((el) => el.id === selectedElementIds[0]);
        if (selected?.isGroup) {
          ungroupElements(selected.id);
        }
        return;
      }

      // Arrow keys - Nudge (1px ou 10px com Shift)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const nudge = e.shiftKey ? 10 : 1;

        selectedElementIds.forEach((id) => {
          const el = elements.find((e) => e.id === id);
          if (!el) return;

          const newPos = { ...el.position };

          switch (e.key) {
            case 'ArrowUp':
              newPos.y -= nudge;
              break;
            case 'ArrowDown':
              newPos.y += nudge;
              break;
            case 'ArrowLeft':
              newPos.x -= nudge;
              break;
            case 'ArrowRight':
              newPos.x += nudge;
              break;
          }

          updateElement(id, { position: newPos });
        });
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementIds, elements]);

  return {};
};
