import { describe, it, expect, beforeEach } from 'vitest';
import { resolveElementTokens } from './themeResolve';
import { DEFAULT_DESIGN_TOKENS } from '../types/designTokens';
import { useEditorStore } from '../store/editorStore';
import type { CatalogElement } from '../types/editor';

const makeEl = (style: Record<string, unknown>): CatalogElement => ({
  id: 'e1',
  type: 'text-title',
  position: { x: 0, y: 0 },
  size: { width: 10, height: 10 },
  pageId: 'p1',
  style: style as CatalogElement['style'],
});

describe('themeResolve / INC-06', () => {
  it('resolve $tokens.* contra os tokens', () => {
    const el = makeEl({ textColor: '$tokens.colors.primary' });
    const resolved = resolveElementTokens(el, DEFAULT_DESIGN_TOKENS);
    expect(resolved.style.textColor).toBe(DEFAULT_DESIGN_TOKENS.colors.primary.value);
  });

  it('mantém valores literais e a mesma referência quando nada muda', () => {
    const el = makeEl({ textColor: '#123456' });
    const resolved = resolveElementTokens(el, DEFAULT_DESIGN_TOKENS);
    expect(resolved).toBe(el); // sem cópia desnecessária
    expect(resolved.style.textColor).toBe('#123456');
  });

  it('sem tokens, devolve o elemento intacto', () => {
    const el = makeEl({ textColor: '$tokens.colors.primary' });
    expect(resolveElementTokens(el, undefined)).toBe(el);
  });
});

describe('applyThemeToElements + tema vivo', () => {
  beforeEach(() => useEditorStore.getState().resetEditor());

  it('liga elementos ao tema e reflete mudança de token', () => {
    const store = useEditorStore.getState();
    store.addElement({
      type: 'text-title',
      position: { x: 0, y: 0 },
      size: { width: 10, height: 10 },
      style: { textColor: '#000000' },
    } as never);

    store.applyThemeToElements();
    let el = useEditorStore.getState().getCurrentPage()!.elements[0];
    expect(el.style.textColor).toBe('$tokens.colors.text.primary');

    // O renderer resolveria a referência para o valor atual do tema...
    const tokens0 = useEditorStore.getState().designTokens!;
    expect(resolveElementTokens(el, tokens0).style.textColor)
      .toBe(tokens0.colors.text.primary.value);

    // ...e mudar o tema muda o valor resolvido (tema "ao vivo").
    useEditorStore.getState().updateDesignTokens({
      colors: {
        ...tokens0.colors,
        text: { ...tokens0.colors.text, primary: { value: '#AB12CD' } },
      },
    });
    el = useEditorStore.getState().getCurrentPage()!.elements[0];
    const tokens1 = useEditorStore.getState().designTokens!;
    expect(resolveElementTokens(el, tokens1).style.textColor).toBe('#AB12CD');
  });
});
