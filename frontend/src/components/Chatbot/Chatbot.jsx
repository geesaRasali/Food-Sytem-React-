import { useState, useRef, useEffect } from 'react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    setInputText('');
    setIsLoading(true);

    
    const userMessage = { role: 'user', content: text, id: Date.now().toString() };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch('http://localhost:4000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) throw new Error('Failed to fetch chat response');

      let assistantContent = '';
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              assistantContent += parsed.content || '';
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }

      // Add assistant message to chat
      if (assistantContent) {
        const assistantMessage = { role: 'assistant', content: assistantContent, id: Date.now().toString() };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = { role: 'assistant', content: 'Error: Failed to get response', id: Date.now().toString() };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen ? (
        <div className="flex h-125 w-[92vw] max-w-sm flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
          <div className="flex items-center justify-between bg-[#ff4c24] px-4 py-4 text-white">
            <h3 className="m-0 text-lg font-semibold">AI Assistant</h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="cursor-pointer border-0 bg-transparent text-base font-bold text-white"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-neutral-50 p-4">
            {messages.length === 0 && (
              <p className="mt-5 text-center text-sm text-neutral-500">Hi! How can I help you today?</p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex w-full ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] wrap-break-word rounded-xl px-3.5 py-2.5 text-sm leading-[1.4] ${
                    m.role === 'user'
                      ? 'rounded-br bg-[#ff4c24] text-white'
                      : 'rounded-bl bg-neutral-200 text-neutral-800'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex w-full justify-start">
                <div className="flex items-center gap-1 rounded-bl rounded-xl bg-neutral-200 px-3.5 py-2">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:0.3s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex border-t border-neutral-200 bg-white p-3">
            <input
              className="flex-1 rounded-full border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-[#ff4c24]"
              value={inputText}
              placeholder="Type your message..."
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              className="ml-2 cursor-pointer rounded-full border-0 bg-[#ff4c24] px-4 font-bold text-white transition-colors hover:bg-[#e63e19] disabled:cursor-not-allowed disabled:bg-neutral-300"
              onClick={sendMessage}
              disabled={isLoading}
            >
              {isLoading ? '...' : 'Send'}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="flex cursor-pointer items-center gap-2 rounded-full border-0 bg-[#ff4c24] px-6 py-3 text-base font-bold text-white shadow-[0_4px_12px_rgba(255,76,36,0.3)] transition-all hover:scale-105 hover:bg-[#e63e19]"
          onClick={() => setIsOpen(true)}
        >
          💬 Chat
        </button>
      )}
    </div>
  );
};

export default Chatbot;
