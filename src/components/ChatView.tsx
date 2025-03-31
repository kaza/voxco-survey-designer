'use client';

import { Message } from '@/types/api';
import { useState, useEffect } from 'react';

interface ChatViewProps {
    chatId: string | null;
}

export default function ChatView({ chatId }: ChatViewProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (chatId) {
            fetchMessages();
        }
    }, [chatId]);

    const fetchMessages = async () => {
        if (!chatId) return;
        
        setLoading(true);
        try {
            const response = await fetch(`/api/chats/${chatId}/messages`);
            const data = await response.json();
            setMessages(data.messages);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!inputMessage.trim() || !chatId) return;

        const content = inputMessage;
        setInputMessage('');

        try {
            const response = await fetch(`/api/chats/${chatId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content }),
            });

            const data = await response.json();
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                content,
                timestamp: new Date().toISOString(),
                sender: 'user'
            }, data.message]);
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen text-white">
                Loading messages...
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`p-3 rounded-lg max-w-[80%] ${
                            message.sender === 'user' 
                                ? 'ml-auto bg-blue-600' 
                                : 'bg-gray-800'
                        }`}
                    >
                        <div className="text-white">{message.content}</div>
                        <div className="text-xs text-gray-300 mt-1">
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