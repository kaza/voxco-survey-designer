// Chat types
export interface Chat {
    id: string;
    title: string;
}

export interface Message {
    id: string;
    content: string;
    timestamp: string;
    sender: 'user' | 'bot';
}

// API Response types
export interface GetChatsResponse {
    chats: Chat[];
}

export interface GetMessagesResponse {
    messages: Message[];
}

export interface SendMessageRequest {
    content: string;
}

export interface SendMessageResponse {
    message: Message;
} 