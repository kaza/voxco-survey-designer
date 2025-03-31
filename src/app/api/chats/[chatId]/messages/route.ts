import { NextResponse } from 'next/server';
import { GetMessagesResponse, SendMessageRequest, SendMessageResponse } from '@/types/api';

// Mock message storage (in memory)
const mockMessages: Record<string, GetMessagesResponse['messages']> = {};

export async function GET(
    request: Request,
    context: { params: { chatId: string } }
) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const { chatId } = context.params;

    const response: GetMessagesResponse = {
        messages: mockMessages[chatId] || []
    };

    return NextResponse.json(response);
}

export async function POST(
    request: Request,
    context: { params: { chatId: string } }
) {
    const { chatId } = context.params;
    const body: SendMessageRequest = await request.json();

    // Create user message
    const userMessage = {
        id: Date.now().toString(),
        content: body.content,
        timestamp: new Date().toISOString(),
        sender: 'user' as const
    };

    // Create bot response
    const botMessage = {
        id: (Date.now() + 1).toString(),
        content: `Hello! You said: "${body.content}". Current time is ${new Date().toLocaleTimeString()}`,
        timestamp: new Date().toISOString(),
        sender: 'bot' as const
    };

    // Initialize chat messages array if it doesn't exist
    if (!mockMessages[chatId]) {
        mockMessages[chatId] = [];
    }

    // Add both messages to the chat
    mockMessages[chatId].push(userMessage, botMessage);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const response: SendMessageResponse = {
        message: botMessage
    };

    return NextResponse.json(response);
} 