'use client';

import { Chat } from '@/types/api';
import { useState, useEffect } from 'react';

interface SidebarProps {
    onChatSelect: (chatId: string) => void;
}

export default function Sidebar({ onChatSelect }: SidebarProps) {
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchChats();
    }, []);

    const fetchChats = async () => {
        try {
            const response = await fetch('/api/chats');
            const data = await response.json();
            setChats(data.chats);
        } catch (error) {
            console.error('Failed to fetch chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChatClick = (chatId: string) => {
        setSelectedChatId(chatId);
        onChatSelect(chatId);
    };

    if (loading) {
        return (
            <div className="w-64 h-screen bg-gray-900 text-white p-4">
                Loading chats...
            </div>
        );
    }

    return (
        <div className="w-64 h-screen bg-gray-900 text-white p-4">
            <div className="space-y-2">
                {chats.map((chat) => (
                    <div
                        key={chat.id}
                        className={`p-3 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors ${
                            selectedChatId === chat.id ? 'bg-gray-800' : ''
                        }`}
                        onClick={() => handleChatClick(chat.id)}
                    >
                        {chat.title}
                    </div>
                ))}
            </div>
        </div>
    );
} 