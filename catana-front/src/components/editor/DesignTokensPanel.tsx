import { type FC } from 'react';
import { X, Palette, Check, RotateCcw, Wand2 } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { DEFAULT_DESIGN_TOKENS, type DesignTokens, type ColorPalette } from '../../types/designTokens';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
}

// Famílias de fonte oferecidas no seletor.
const FONT_FAMILIES = [
  'Inter, system-ui, sans-serif',
  'Georgia, serif',
  'Poppins, system-ui, sans-serif',
  'Roboto, system-ui, sans-serif',
  'Montserrat, system-ui, sans-serif',
  '"Courier New", monospace',
];

// Presets de tema de um clique (sobrescrevem a paleta principal).
const PRESETS: Array<{ name: string; colors: Partial<Record<keyof ColorPalette, string>> & { text?: string } }> = [
  { name: 'Catana', colors: { primary: '#4472C4', secondary: '#FF6B6B', accent: '#FFA500', background: '#FFFFFF', surface: '#F5F5F5', text: '#1A1A1A' } },
  { name: 'Esmeralda', colors: { primary: '#0F766E', secondary: '#14B8A6', accent: '#F59E0B', background: '#FFFFFF', surface: '#ECFDF5', text: '#11302C' } },
  { name: 'Grafite', colors: { primary: '#111827', secondary: '#6B7280', accent: '#EF4444', background: '#FFFFFF', surface: '#F3F4F6', text: '#111827' } },
  { name: 'Vinho', colors: { primary: '#7C2D3A', secondary: '#B05D6B', accent: '#E0A458', background: '#FFFDF8', surface: '#F7ECE6', text: '#2C1418' } },
];

export const DesignTokensPanel: FC<Props> = ({ open, onClose }) => {
  const tokens = useEditorStore((s) => s.designTokens) ?? DEFAULT_DESIGN_TOKENS;
  const updateDesignTokens = useEditorStore((s) => s.updateDesignTokens);
  const setDesignTokens = useEditorStore((s) => s.setDesignTokens);
  const resetDesignTokens = useEditorStore((s) => s.resetDesignTokens);
  const applyThemeToElements = useEditorStore((s) => s.applyThemeToElements);

  if (!open) return null;

  const colorValue = (key: keyof ColorPalette): string => {
    const c = tokens.colors[key];
    return (c && typeof c === 'object' && 'value' in c ? (c.value as string) : '#000000');
  };

  const setColor = (key: keyof ColorPalette, value: string) => {
    updateDesignTokens({
      colors: { ...tokens.colors, [key]: { ...(tokens.colors[key] as object), value } },
    });
  };

  const setTextColor = (sub: 'primary' | 'secondary', value: string) => {
    updateDesignTokens({
      colors: {
        ...tokens.colors,
        text: { ...tokens.colors.text, [sub]: { ...tokens.colors.text[sub], value } },
      },
    });
  };

  const setFontFamily = (family: string) => {
    const typography = Object.fromEntries(
      Object.entries(tokens.typography).map(([k, v]) => [k, v ? { ...v, fontFamily: family } : v])
    ) as DesignTokens['typography'];
    updateDesignTokens({ typography });
  };

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    const c = preset.colors;
    const next: DesignTokens = {
      ...tokens,
      name: `Tema ${preset.name}`,
      colors: {
        ...tokens.colors,
        primary: { ...tokens.colors.primary, value: c.primary ?? colorValue('primary') },
        secondary: { ...tokens.colors.secondary, value: c.secondary ?? colorValue('secondary') },
        accent: { ...(tokens.colors.accent ?? {}), value: c.accent ?? colorValue('accent') },
        background: { ...tokens.colors.background, value: c.background ?? colorValue('background') },
        surface: { ...tokens.colors.surface, value: c.surface ?? colorValue('surface') },
        text: {
          ...tokens.colors.text,
          primary: { ...tokens.colors.text.primary, value: c.text ?? tokens.colors.text.primary.value },
        },
      },
    };
    setDesignTokens(next);
  };

  const handleApplyToElements = () => {
    applyThemeToElements();
    toast.success('Tema aplicado aos elementos. Edite as cores para ver tudo mudar ao vivo.');
  };

  const currentFont = tokens.typography.body?.fontFamily ?? FONT_FAMILIES[0];

  const ColorRow = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="text-xs text-gray-600 dark:text-gray-300">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded border border-gray-300 dark:border-zinc-700 bg-transparent cursor-pointer"
          aria-label={label}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 text-xs px-1.5 py-1 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-200"
        />
      </div>
    </div>
  );

  return (
    <div className="fixed top-14 right-0 bottom-0 w-72 z-40 bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 shadow-xl flex flex-col">
      <div className="flex items-center justify-between px-4 h-11 border-b border-gray-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-100">
          <Palette className="w-4 h-4" /> Tema global
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" title="Fechar">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
        {/* Presets */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Presets</h3>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => applyPreset(p)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <span className="flex -space-x-1">
                  <span className="w-3 h-3 rounded-full border border-white dark:border-zinc-900" style={{ background: p.colors.primary }} />
                  <span className="w-3 h-3 rounded-full border border-white dark:border-zinc-900" style={{ background: p.colors.secondary }} />
                  <span className="w-3 h-3 rounded-full border border-white dark:border-zinc-900" style={{ background: p.colors.accent }} />
                </span>
                <span className="text-xs text-gray-700 dark:text-gray-200">{p.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Paleta */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Cores</h3>
          <ColorRow label="Primária" value={colorValue('primary')} onChange={(v) => setColor('primary', v)} />
          <ColorRow label="Secundária" value={colorValue('secondary')} onChange={(v) => setColor('secondary', v)} />
          <ColorRow label="Destaque" value={colorValue('accent')} onChange={(v) => setColor('accent', v)} />
          <ColorRow label="Fundo" value={colorValue('background')} onChange={(v) => setColor('background', v)} />
          <ColorRow label="Superfície" value={colorValue('surface')} onChange={(v) => setColor('surface', v)} />
          <ColorRow label="Borda" value={colorValue('border')} onChange={(v) => setColor('border', v)} />
          <ColorRow label="Texto" value={tokens.colors.text.primary.value} onChange={(v) => setTextColor('primary', v)} />
          <ColorRow label="Texto 2" value={tokens.colors.text.secondary.value} onChange={(v) => setTextColor('secondary', v)} />
        </section>

        {/* Tipografia */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Tipografia</h3>
          <select
            value={currentFont}
            onChange={(e) => setFontFamily(e.target.value)}
            className="w-full text-xs px-2 py-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-200"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f} value={f}>{f.split(',')[0].replace(/"/g, '')}</option>
            ))}
          </select>
        </section>
      </div>

      {/* Ações */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-zinc-800 space-y-2">
        <button
          onClick={handleApplyToElements}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-md hover:opacity-90 transition-opacity"
          title="Liga os elementos ao tema (cores/fontes viram referências do tema)"
        >
          <Wand2 className="w-3.5 h-3.5" /> Aplicar tema aos elementos
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { resetDesignTokens(); toast.message('Tema restaurado para o padrão.'); }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-zinc-700 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-800"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restaurar
          </button>
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-zinc-700 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-800"
          >
            <Check className="w-3.5 h-3.5" /> Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
