import type { Message } from '../../types';
import './ChatSidebar.css';

interface ChatSidebarProps {
    messages: Message[];
    prompt: string;
    isLoading: boolean;
    onPromptChange: (value: string) => void;
    onSend: () => void;
}

export default function ChatSidebar({ messages, prompt, isLoading, onPromptChange, onSend }: ChatSidebarProps) {
    return (
        <div className="sidebar">
            <div className="sidebar-title">💬 הצ'אט שלך עם הבוט</div>

            <div className="sidebar-messages">
                {messages.map((msg, i) => (
                    <div key={i} className={`message-row ${msg.type}`}>
                        <div className={`message-bubble ${msg.type}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="message-row bot">
                        <div className="message-bubble loading">🤖 מצייר...</div>
                    </div>
                )}
            </div>

            <div className="sidebar-input">
                <input
                    value={prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onSend()}
                    placeholder="כתוב הודעה..."
                />
                <button onClick={onSend} disabled={isLoading}>שלח</button>
            </div>
        </div>
    );
}
