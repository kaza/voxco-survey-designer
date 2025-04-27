import { useChat } from "@ai-sdk/react";
import { useState, useEffect, useCallback } from "react";
import { ArrowUpIcon, UserIcon, SparklesIcon } from "./Icons";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ChatPage() {
  const [selectedModel, setSelectedModel] = useState("claude");
  
  const { messages, input, handleInputChange, handleSubmit, status, error } =
    useChat({
      api: "/api/chat",
      body: {
        model: selectedModel,
      },
      onError: (err) => {
        console.error("Chat error:", err);
      },
    });

  const [isMobile, setIsMobile] = useState(false);

  // Check if viewport is mobile size
  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth < 768);
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Use callback ref to scroll to bottom when messages change
  const messagesEndRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      // Using setTimeout to ensure this happens after render is complete
      setTimeout(() => {
        node.scrollIntoView({ behavior: "smooth" });
      }, 0);
    }
  }, []); // Empty dependencies to avoid linter warnings

  // Models available for selection
  const models = [
    { id: "openai", name: "OpenAI" },
    { id: "google", name: "Google" },
    { id: "claude", name: "Claude" },
  ];

  // Handle model change
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm py-4 px-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
          AI Chat
        </h1>
      </header>

      {/* Chat container */}
      <div className="flex-1 w-full mx-auto p-2 sm:p-4 flex flex-col">
        {/* Messages area */}
        <div className="flex-1 space-y-3 mb-2 overflow-y-auto rounded-lg bg-white dark:bg-gray-800 p-3 shadow-sm border border-gray-200 dark:border-gray-700 pb-20">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 space-y-2 py-4">
              <SparklesIcon className="h-10 w-10 text-blue-500 dark:text-blue-400" />
              <p className="text-center max-w-md">
                Start a conversation with the AI assistant. Ask anything!
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-1/2 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex ${
                    m.role === "user"
                      ? `max-w-[80%] ${isMobile ? "max-w-[90%]" : ""}`
                      : "w-full"
                  }`}
                >
                  <div
                    className={`${
                      m.role === "user"
                        ? "rounded-2xl px-3 py-2 shadow-sm bg-blue-600 text-white ml-2"
                        : "flex-1 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2"
                    }`}
                  >
                    {m.parts.map((part) => {
                      const partKey = `${m.id}-${part.type}-${JSON.stringify(
                        part
                      )}`;
                      if (part.type === "text")
                        return (
                          <div
                            key={partKey}
                            className="whitespace-pre-wrap text-sm sm:text-base"
                          >
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: ({...props}) => <h1 className="text-xl font-bold mt-3 mb-1" {...props} />,
                                h2: ({...props}) => <h2 className="text-lg font-bold mt-2 mb-1" {...props} />,
                                h3: ({...props}) => <h3 className="text-md font-bold mt-1 mb-1" {...props} />,
                                p: ({...props}) => <p className="my-1" {...props} />,
                                ul: ({...props}) => <ul className="list-disc pl-4 my-1" {...props} />,
                                ol: ({...props}) => <ol className="list-decimal pl-4 my-1" {...props} />,
                                li: ({...props}) => <li className="my-0.5" {...props} />,
                                a: ({...props}) => <a className="text-blue-500 hover:underline" {...props} />,
                                blockquote: ({...props}) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-3 py-0.5 my-1 italic" {...props} />,
                                hr: () => <hr className="my-2 border-gray-300 dark:border-gray-600" />,
                                table: ({...props}) => <div className="overflow-x-auto my-1"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props} /></div>,
                                code: ({className, children, ...props}) => {
                                  const match = /language-(\w+)/.exec(className || '');
                                  return !className || !match ? (
                                    <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                                      {children}
                                    </code>
                                  ) : (
                                    <div className="relative rounded-md overflow-hidden my-1">
                                      <div className="absolute top-0 right-0 px-1 py-0.5 text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-200 dark:bg-gray-900 rounded-bl">
                                        {match[1]}
                                      </div>
                                      <pre className="p-2 pt-5 bg-gray-100 dark:bg-gray-800 overflow-x-auto rounded-md text-sm font-mono">
                                        <code {...props}>{children}</code>
                                      </pre>
                                    </div>
                                  );
                                }
                              }}
                            >
                              {part.text}
                            </ReactMarkdown>
                          </div>
                        );
                      if (part.type === "tool-invocation")
                        return (
                          <div
                            key={partKey}
                            className="text-xs opacity-75 mt-1 italic"
                          >
                            Using tool: {part.toolInvocation.toolName}
                          </div>
                        );
                      return null;
                    })}
                  </div>

                  {m.role === "user" && (
                    <div className="flex-shrink-0 ml-2">
                      <div className="flex items-center justify-center h-7 w-7 rounded-full bg-gray-200 dark:bg-gray-600">
                        <UserIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input form - fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-full mx-auto">
          {/* Error display area */}
          {error && (
            <div className="mb-2 p-2 text-center text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg text-sm">
              <p>Error: {error.message}</p>
            </div>
          )}
          {/* Form */}
          <form onSubmit={handleSubmit} className="relative flex items-center">
            {/* Model selector */}
            <div className="mr-2">
              <div className="relative">
                <select
                  value={selectedModel}
                  onChange={handleModelChange}
                  className="appearance-none pl-4 pr-8 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:text-white font-medium"
                >
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                  <svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Input field */}
            <div className="flex-1 relative">
              <input
                className="w-full py-4 pl-4 pr-12 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:text-white"
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
                disabled={status !== 'ready'}
              />
              <button
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full h-10 w-10 flex items-center justify-center transition-all ${
                  input.trim()
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                }`}
                type="submit"
                disabled={!input.trim() || status !== 'ready'}
              >
                {(status === 'submitted' || status === 'streaming') ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ArrowUpIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
