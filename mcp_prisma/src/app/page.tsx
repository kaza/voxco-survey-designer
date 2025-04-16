"use client";
import { useChat } from "@ai-sdk/react";

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/chat",
  });

  return (
    <div className="max-w-xl mx-auto p-4 min-h-screen flex flex-col justify-between">
      <div className="flex-1 space-y-2 mb-4 overflow-y-auto">
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "text-right text-blue-600"
                : "text-left text-gray-800"
            }
          >
            {m.parts.map((part) => {
              const partKey = `${m.id}-${part.type}-${JSON.stringify(part)}`;
              if (part.type === "text") return <p key={partKey}>{part.text}</p>;
              if (part.type === "tool-invocation")
                return (
                  <div key={partKey} className="text-xs text-gray-500">
                    [Tool: {part.toolInvocation.toolName}]
                  </div>
                );
              // Add more part types as needed
              return null;
            })}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
        <input
          className="flex-1 border rounded p-2"
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message…"
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          type="submit"
        >
          Send
        </button>
      </form>
    </div>
  );
}
