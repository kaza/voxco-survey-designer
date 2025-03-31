'use client';

import { Chat } from '@/types/chat';
import { useState } from 'react';

interface SidebarProps {
    onChatSelect: (chatId: string) => void;
}

// Dummy data for now
const dummyChats: Chat[] = [
    { id: '1', title: 'Chat with John' },
    { id: '2', title: 'Project Discussion' },
    { id: '3', title: 'Team Meeting' },
];

export default function Sidebar({ onChatSelect }: SidebarProps) {
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

    const handleChatClick = (chatId: string) => {
        setSelectedChatId(chatId);
        onChatSelect(chatId);
    };

    return (
        <div className="w-64 h-screen bg-gray-900 text-white p-4">
            <div className="space-y-2">
                {dummyChats.map((chat) => (
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