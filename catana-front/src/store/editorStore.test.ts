import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from './editorStore';

// DIV-04: caminhos críticos do editorStore (multi-página, undo/redo, IDs únicos).
const reset = () => useEditorStore.getState().resetEditor();

describe('editorStore', () => {
  beforeEach(() => reset());

  it('começa com uma página e IDs únicos por página', () => {
    const { pages } = useEditorStore.getState();
    expect(pages).toHaveLength(1);
    expect(pages[0].id).toMatch(/^page-/);
  });

  it('addPage adiciona página com ID distinto e foca nela', () => {
    const s = useEditorStore.getState();
    const firstId = s.pages[0].id;
    s.addPage();
    const after = useEditorStore.getState();
    expect(after.pages).toHaveLength(2);
    expect(after.pages[1].id).not.toBe(firstId);
    expect(after.currentPageId).toBe(after.pages[1].id);
  });

  it('addElement/deleteElement com undo/redo', () => {
    const s = useEditorStore.getState();
    s.addElement({
      type: 'text-title',
      position: { x: 0, y: 0 },
      size: { width: 10, height: 10 },
      style: {},
    } as any);

    let page = useEditorStore.getState().getCurrentPage();
    expect(page?.elements).toHaveLength(1);
    const elId = page!.elements[0].id;
    expect(elId).toMatch(/^element-/);

    useEditorStore.getState().deleteElement(elId);
    expect(useEditorStore.getState().getCurrentPage()?.elements).toHaveLength(0);

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().getCurrentPage()?.elements).toHaveLength(1);

    useEditorStore.getState().redo();
    expect(useEditorStore.getState().getCurrentPage()?.elements).toHaveLength(0);
  });

  it('não deleta a última página', () => {
    const s = useEditorStore.getState();
    const onlyId = s.pages[0].id;
    s.deletePage(onlyId);
    expect(useEditorStore.getState().pages).toHaveLength(1);
  });
});
