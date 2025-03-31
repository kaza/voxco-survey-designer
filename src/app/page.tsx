'use client';

import Sidebar from '@/components/Sidebar';
import ChatView from '@/components/ChatView';
import { useState } from 'react';

export default function Home() {
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

    const handleChatSelect = (chatId: string) => {
        setSelectedChatId(chatId);
    };

    return (
        <main className="flex min-h-screen bg-gray-950">
            <Sidebar onChatSelect={handleChatSelect} />
            <div className="flex-1">
                {selectedChatId ? (
                    <ChatView chatId={selectedChatId} />
                ) : (
                    <div className="flex items-center justify-center h-screen text-white">
                        <p>Select a chat to begin</p>
                    </div>
                )}
            </div>
        </main>
    );
}
