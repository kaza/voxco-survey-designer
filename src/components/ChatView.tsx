'use client';

import { Message } from '@/types/chat';
import { useState } from 'react';

interface ChatViewProps {
    chatId: string | null;
}

export default function ChatView({ chatId }: ChatViewProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!inputMessage.trim()) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            content: inputMessage,
            timestamp: new Date().toISOString()
        };

        // Add bot response
        const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: `Hello world! Current time: ${new Date().toLocaleTimeString()}`,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage, botMessage]);
        setInputMessage('');
    };

    return (
        <div className="flex flex-col h-screen">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className="p-3 rounded-lg bg-gray-800 max-w-[80%]"
                    >
                        <div className="text-white">{message.content}</div>
                        <div className="text-xs text-gray-400 mt-1">
                            {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                    </div>
                ))}
            </div>

            {/* Input area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 p-2 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
} 