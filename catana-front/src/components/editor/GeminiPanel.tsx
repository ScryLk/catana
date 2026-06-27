import { type FC, useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User } from 'lucide-react';
import { Button } from '../ui/button';
import { useEditorStore } from '../../store/editorStore';
import { geminiService } from '../../services/geminiService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedActions?: string[];
}

export const GeminiPanel: FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou o Gemini, seu assistente de design. Como posso ajudar você a criar seu catálogo hoje?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const { selectedElementId, currentPageId } = useEditorStore();

  const handleSendMessage = async (text: string = inputValue) => {
    if (!text.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await geminiService.sendMessage(text, {
        selectedElementId,
        currentPageId
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        suggestedActions: response.suggestedActions
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua solicitação.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900/50">
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user'
                ? 'bg-zinc-200 dark:bg-zinc-800'
                : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700'
                }`}
            >
              {msg.role === 'user' ? (
                <User className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
              ) : (
                <Sparkles className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
              )}
            </div>
            <div
              className={`p-3 rounded-2xl max-w-[85%] ${msg.role === 'user'
                ? 'bg-zinc-900 text-white rounded-tr-none'
                : 'bg-zinc-100 text-zinc-800 rounded-tl-none'
                }`}
            >
              <p className="text-sm leading-relaxed">{msg.content}</p>
              {msg.suggestedActions && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {msg.suggestedActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(action)}
                      className="text-xs bg-white border border-zinc-200 px-2 py-1 rounded-full hover:bg-zinc-50 transition-colors text-zinc-600"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mr-2">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="bg-zinc-100 p-3 rounded-2xl rounded-tl-none">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-zinc-100 bg-white">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Descreva o que você quer criar..."
            className="w-full pl-4 pr-12 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all text-sm text-zinc-900 placeholder:text-zinc-400"
          />
          <Button
            size="icon"
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-1.5 w-9 h-9 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-center text-zinc-400 mt-2">
          O Gemini pode cometer erros. Verifique as informações importantes.
        </p>
      </div>
    </div>
  );
};
