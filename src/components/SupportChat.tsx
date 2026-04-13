import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { MessageCircle, Send, User, Bot, X } from 'lucide-react';
import { getRideSupport } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';

export function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string, text: string }[]>([
    { role: 'model', text: 'Olá! Sou o assistente Amuvi. Como posso ajudar você hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const response = await getRideSupport(userMessage, messages);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'Desculpe, tive um problema ao processar sua mensagem.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4"
          >
            <Card className="w-80 sm:w-96 h-[500px] shadow-2xl border-none flex flex-col overflow-hidden">
              <CardHeader className="bg-blue-600 text-white p-4 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Bot size={20} /> Suporte Amuvi
                </CardTitle>
                <Button variant="ghost" size="icon" className="text-white hover:bg-blue-700" onClick={() => setIsOpen(false)}>
                  <X size={20} />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 p-0 flex flex-col bg-slate-50">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                          m.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-tr-none' 
                            : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                        }`}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>
                <div className="p-4 bg-white border-t flex gap-2">
                  <Input 
                    placeholder="Digite sua dúvida..." 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    className="flex-1"
                  />
                  <Button size="icon" onClick={handleSend} disabled={loading || !input.trim()}>
                    <Send size={18} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button 
        size="lg" 
        className={`rounded-full w-14 h-14 shadow-xl transition-all duration-300 ${isOpen ? 'rotate-90 bg-slate-800' : 'bg-blue-600 hover:bg-blue-700'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </Button>
    </div>
  );
}
