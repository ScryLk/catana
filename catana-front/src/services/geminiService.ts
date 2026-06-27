import { useEditorStore } from '../store/editorStore';
import { imageProcessingService } from './imageProcessingService';

export interface EditorContext {
  selectedElementId: string | null;
  currentPageId: string;
}

export interface GeminiResponse {
  content: string;
  actionTaken: boolean;
  suggestedActions?: string[];
}

class GeminiService {
  private colors: Record<string, string> = {
    'vermelho': '#EF4444',
    'azul': '#3B82F6',
    'verde': '#10B981',
    'amarelo': '#F59E0B',
    'roxo': '#8B5CF6',
    'rosa': '#EC4899',
    'preto': '#000000',
    'branco': '#FFFFFF',
    'cinza': '#6B7280',
    'laranja': '#F97316',
    'indigo': '#6366F1',
  };

  async sendMessage(message: string, context: EditorContext): Promise<GeminiResponse> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 600));

    const command = message.toLowerCase();
    const store = useEditorStore.getState();

    if (!context.selectedElementId) {
      return {
        content: 'Para que eu possa ajudar com edições, por favor selecione um elemento no editor primeiro.',
        actionTaken: false
      };
    }

    // Comandos de Imagem (Remover Fundo)
    if (command.includes('remover fundo') || command.includes('sem fundo') || command.includes('recortar')) {
      const element = store.pages.find(p => p.id === context.currentPageId)?.elements.find(e => e.id === context.selectedElementId);

      if (!element || !element.content.src) {
        return {
          content: 'O elemento selecionado não parece ser uma imagem válida.',
          actionTaken: false
        };
      }

      try {
        // Notificar inicio do processo (idealmente teríamos um stream de resposta, mas aqui vamos esperar)
        const processedUrl = await imageProcessingService.removeBackground(element.content.src);

        store.updateElement(context.selectedElementId, { content: { ...element.content, src: processedUrl } });

        return {
          content: 'Pronto! Removi o fundo da imagem para você.',
          actionTaken: true
        };
      } catch (error) {
        return {
          content: 'Desculpe, tive um problema ao tentar remover o fundo dessa imagem.',
          actionTaken: false
        };
      }
    }

    // Comandos de Cor
    if (command.includes('cor') || command.includes('fundo') || command.includes('pintar')) {
      for (const [name, hex] of Object.entries(this.colors)) {
        if (command.includes(name)) {
          store.updateElementStyle(context.selectedElementId, { backgroundColor: hex, textColor: hex });
          return {
            content: `Entendido! Mudei a cor do elemento para ${name}.`,
            actionTaken: true
          };
        }
      }
      return {
        content: 'Entendi que você quer mudar a cor, mas não reconheci qual. Tente cores como "azul", "vermelho", "verde", etc.',
        actionTaken: false,
        suggestedActions: ['Mudar para azul', 'Mudar para vermelho', 'Mudar para verde']
      };
    }

    // Comandos de Texto
    if (command.includes('texto') || command.includes('escrever') || command.includes('conteúdo')) {
      const match = command.match(/texto para (.+)/) || command.match(/escrever (.+)/) || command.match(/conteúdo para (.+)/);
      if (match && match[1]) {
        const newText = match[1].trim();
        store.updateElement(context.selectedElementId, { content: { text: newText } });
        return {
          content: `Texto atualizado para: "${newText}"`,
          actionTaken: true
        };
      }
      return {
        content: 'Para alterar o texto, diga algo como "mudar texto para Olá Mundo".',
        actionTaken: false
      };
    }

    // Comandos de Fonte/Tamanho
    if (command.includes('fonte') || command.includes('tamanho') || command.includes('letra')) {
      if (command.includes('aumentar') || command.includes('maior')) {
        store.updateElementStyle(context.selectedElementId, { fontSize: 24 }); // Simplificação: valor fixo por enquanto
        return {
          content: 'Aumentei o tamanho da fonte para destacar melhor o texto.',
          actionTaken: true
        };
      } else if (command.includes('diminuir') || command.includes('menor')) {
        store.updateElementStyle(context.selectedElementId, { fontSize: 12 });
        return {
          content: 'Diminui o tamanho da fonte.',
          actionTaken: true
        };
      }
    }

    // Comandos de Posição (Exemplo extra)
    if (command.includes('centralizar') || command.includes('centro')) {
      // Lógica simplificada, idealmente calcularia com base no tamanho da página
      store.updateElement(context.selectedElementId, { position: { x: 400, y: 300 } });
      return {
        content: 'Centralizei o elemento na página.',
        actionTaken: true
      };
    }

    // Fallback
    return {
      content: 'Ainda estou aprendendo! Tente comandos como "mudar cor para azul", "aumentar fonte" ou "mudar texto para Promoção".',
      actionTaken: false,
      suggestedActions: ['Mudar cor para azul', 'Aumentar fonte', 'Mudar texto para Promoção']
    };
  }
}

export const geminiService = new GeminiService();
