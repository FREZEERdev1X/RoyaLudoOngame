import React, { useState } from 'react';
import { ChatMessage, PlayerColor } from '../types/game';
import { Language, QUICK_CHAT_MESSAGES, CHAT_EMOJIS, translations } from '../i18n/translations';
import { sound } from '../utils/soundEngine';
import { MessageSquare, Send, Smile, X } from 'lucide-react';

interface InGameChatProps {
  messages: ChatMessage[];
  lang: Language;
  onSendMessage: (text: string) => void;
  onSendEmoji: (emoji: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const InGameChat: React.FC<InGameChatProps> = ({
  messages,
  lang,
  onSendMessage,
  onSendEmoji,
  isOpen,
  onClose,
}) => {
  const [inputText, setInputText] = useState('');
  const [showQuickPhrases, setShowQuickPhrases] = useState(true);
  const t = translations[lang];
  const quickPhrases = QUICK_CHAT_MESSAGES[lang] || QUICK_CHAT_MESSAGES.ar;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    sound.playClick();
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handlePhraseClick = (phrase: string) => {
    sound.playClick();
    onSendMessage(phrase);
  };

  const handleEmojiClick = (emoji: string) => {
    sound.playClick();
    onSendEmoji(emoji);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 end-0 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-xl border-s border-amber-500/20 shadow-2xl z-50 flex flex-col text-white animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-amber-400" />
          <span className="font-bold text-sm">{t.chat}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Interactive Emojis Strip */}
      <div className="p-2 border-b border-slate-800 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {CHAT_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleEmojiClick(emoji)}
            className="text-2xl p-1.5 hover:bg-slate-800 rounded-xl hover:scale-125 transition-transform active:scale-95"
            title="Send Emoji"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Messages History */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center px-4">
            <MessageSquare size={32} className="mb-2 opacity-40 text-amber-400" />
            <p>لا توجد رسائل بعد. أرسل تحية سريعة للاعبين!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={msg.id ? `${msg.id}-${idx}` : `msg-${idx}`} className="flex flex-col text-start">
              <div className="flex items-center gap-1 text-[11px]">
                {msg.isSpectator ? (
                  <span className="font-bold text-purple-400 flex items-center gap-1">
                    <span>{msg.senderName}</span>
                    <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] px-1 py-0.2 rounded font-normal">
                      👁️ مشاهد
                    </span>
                  </span>
                ) : (
                  <span
                    className="font-bold capitalize"
                    style={{
                      color:
                        msg.senderColor === 'red'
                          ? '#ef4444'
                          : msg.senderColor === 'green'
                          ? '#10b981'
                          : msg.senderColor === 'yellow'
                          ? '#eab308'
                          : '#3b82f6',
                    }}
                  >
                    {msg.senderName}
                  </span>
                )}
                <span className="text-slate-500 text-[9px]">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="mt-0.5 bg-slate-800/80 border border-slate-700/60 rounded-2xl rounded-ss-none px-3 py-1.5 text-xs text-slate-200 inline-block max-w-[85%] self-start shadow-sm">
                {msg.emoji ? (
                  <span className="text-2xl">{msg.emoji}</span>
                ) : (
                  <span>{msg.text}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Phrases Toggle & List */}
      {showQuickPhrases && (
        <div className="p-2 border-t border-slate-800 bg-slate-950/80 max-h-36 overflow-y-auto">
          <div className="text-[10px] text-slate-400 font-bold mb-1.5 px-1">{t.quickChat}</div>
          <div className="flex flex-wrap gap-1.5">
            {quickPhrases.map((phrase, idx) => (
              <button
                key={idx}
                onClick={() => handlePhraseClick(phrase)}
                className="text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-500/50 text-slate-200 px-2 py-1 rounded-xl transition-all active:scale-95 text-start"
              >
                {phrase}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Text Input Form */}
      <form onSubmit={handleSend} className="p-2 border-t border-slate-800 bg-slate-950 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setShowQuickPhrases(!showQuickPhrases)}
          className={`p-2 rounded-xl border transition-colors ${
            showQuickPhrases ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}
          title={t.quickChat}
        >
          <Smile size={18} />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t.typeMessage}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          id="chat-input-field"
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold transition-transform active:scale-95"
          id="chat-send-btn"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
