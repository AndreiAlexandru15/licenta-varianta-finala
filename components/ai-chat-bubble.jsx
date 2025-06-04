"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Send, Bot, User, MessageCircle } from "lucide-react";
import { useSession } from 'next-auth/react';

const AiChatBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll la ultimul mesaj
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  // Formatează răspunsul AI pentru afișare
  const formatAIResponse = (response) => {
    if (!response) return '';
    
    console.log('Formatez răspunsul AI:', response);
    
    let text = '';
    
    // Extrage textul din diferite formate de răspuns
    if (typeof response === 'string') {
      text = response;
    } else if (response.text) {
      text = response.text;
    } else if (response.response) {
      text = response.response;
    } else if (response.message) {
      text = response.message;
    } else if (response.data && response.data.text) {
      text = response.data.text;
    } else if (response.data && response.data.response) {
      text = response.data.response;
    } else {
      // Dacă nu găsim textul în proprietățile standard, încearcă să extragi din obiect
      console.warn('Structură răspuns nerecunoscută:', response);
      text = JSON.stringify(response, null, 2);
    }
    
    // Curăță și formatează textul
    text = String(text)
      .replace(/\\n/g, '\n')           // Înlocuiește \n cu newline real
      .replace(/\\"/g, '"')            // Înlocuiește \" cu "
      .replace(/\\'/g, "'")            // Înlocuiește \' cu '
      .replace(/\\\\/g, '\\')          // Înlocuiește \\ cu \
      .trim();                         // Elimină spațiile de la început și sfârșit
    
    console.log('Text formatat:', text);
    return text;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Generează un session ID unic când se deschide chat-ul pentru prima dată
  const generateSessionId = () => {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Inițializează session ID când se deschide modalul
  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (open && !sessionId) {
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      console.log('Session ID generat:', newSessionId);
    }
  };
  
  const suggestions = [
    "Cum funcționează registratura?",
    "Ce tipuri de documente pot fi înregistrate?",
    "Cum pot căuta o înregistrare?",
    "Care sunt procedurile de arhivare?"
  ];
  
  const sendToAPI = async (message) => {
    try {
      const formData = new FormData();
      // Adaugă mesajul și metadata
      formData.append('message', message);
      formData.append('timestamp', new Date().toISOString());
      formData.append('userAgent', navigator.userAgent);
      formData.append('sessionId', sessionId || generateSessionId());
      
      // Adaugă informații despre utilizator dacă sunt disponibile
      if (session?.user) {
        formData.append('userId', session.user.id);
        formData.append('userName', session.user.name);
      }
      
      // Apelează API-ul local
      console.log('Trimit cerere către /api/ai/chat...');
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Eroare răspuns API:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Răspuns primit de la API:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Eroare necunoscută');
      }
      
      return result;
    } catch (error) {
      console.error('Eroare la apelarea API-ului:', error);
      throw error;
    }
  };
  
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    if (isSending) return; // Previne trimiterea multiplă

    const newMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsSending(true);
    setIsTyping(true);

    try {
      // Trimite către API
      const apiResponse = await sendToAPI(currentInput);
      console.log('Răspuns primit de la API:', apiResponse);
      
      // Formatează răspunsul AI
      const responseText = formatAIResponse(apiResponse);
      
      // Fallback dacă nu găsim textul formatat
      const finalResponseText = responseText || 
        `Am primit mesajul tău. Datele au fost procesate cu succes.`;
      
      console.log('Text final pentru afișare:', finalResponseText);
      
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: finalResponseText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      const errorResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Ne pare rău, a apărut o eroare la procesarea mesajului. Te rugăm să încerci din nou.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
      setIsSending(false);
    }
  };
  
  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
  };

  // Inițializează mesajele cu salutul personalizat când avem datele utilizatorului
  useEffect(() => {
    if (status === 'loading') return;
    const userName = session?.user?.name;
    if (userName) {
      setMessages([
        {
          id: 1,
          type: 'ai',
          content: `Salut, ${userName}! Sunt aici să te ajut cu întrebările tale despre registratură.`,
          timestamp: new Date(),
        }
      ]);
    } else {
      setMessages([
        {
          id: 1,
          type: 'ai',
          content: 'Salut! Sunt aici să te ajut cu întrebările tale despre registratură.',
          timestamp: new Date(),
        }
      ]);
    }
  }, [session, status]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 h-12 w-12 rounded-full fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors">
          <MessageCircle className="w-8 h-8" />
        </Button>
      </DialogTrigger>        <DialogContent className="max-w-3xl max-h-[90vh] h-[80vh] flex flex-col p-0">        <DialogHeader className="flex-shrink-0 border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Chat cu AI Assistant
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col min-h-0">
          {/* Zona de mesaje cu scroll */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 break-words ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {message.type === 'ai' && <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                      {message.type === 'user' && <User className="w-4 h-4 mt-0.5 flex-shrink-0" />}                      <div className="flex-1">                        <div className="text-sm whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </div>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
                {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3 max-w-[70%]">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Referință pentru auto-scroll */}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Separator și controale de jos */}
          <div className="border-t px-6 py-4 space-y-4">
            {/* Sugestii */}
            {messages.length <= 1 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Sugestii:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>              </div>
            )}

            {/* Input pentru mesaje */}
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Scrie mesajul tău aici..."
                    disabled={isSending}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !isSending) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    size="icon" 
                    disabled={isSending || !inputValue.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AiChatBubble;