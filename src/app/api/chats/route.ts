import { NextResponse } from 'next/server';
import { GetChatsResponse } from '@/types/api';

// Mock data
const mockChats = [
    { id: '1', title: 'Phone Survey' },
    { id: '2', title: 'Zebra Survey' },
    { id: '3', title: 'Web Surfing' },
];

export async function GET() {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const response: GetChatsResponse = {
        chats: mockChats
    };

    return NextResponse.json(response);
} 