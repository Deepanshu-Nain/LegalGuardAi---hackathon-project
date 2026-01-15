import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Mic, MicOff, Send, Settings, Menu, X, MessageSquare, Zap, Volume2, User, Image as ImageIcon, LogOut } from 'lucide-react';
import globeImage from 'figma:asset/ef6432358e70cd07cef418bda499a8b4438f8bd9.png';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export function ResponsiveAIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = () => {
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Hello! I'm your AI assistant. I'm here to help you with anything you need. How can I assist you today?";
    } else if (lowerMessage.includes('weather')) {
      return "I'd love to help with weather information! In a full implementation, I'd connect to a weather API to give you current conditions for your location.";
    } else if (lowerMessage.includes('time')) {
      return `The current time is ${new Date().toLocaleTimeString()}.`;
    } else if (lowerMessage.includes('help')) {
      return "I'm here to help! You can ask me questions, have a conversation, or use voice input by tapping the microphone button.";
    } else {
      return "That's an interesting question! I'm a demo AI assistant with simulated responses, but I'm designed to show how voice and chat interactions work together.";
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setShowChat(true);

    // Generate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateAIResponse(inputText),
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);

    setInputText('');
  };

  const handleVoiceInput = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const handleSpeak = (text: string) => {
    if (!speechSynthesis) {
      alert('Speech synthesis is not supported in your browser.');
      return;
    }

    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800/20 via-black/20 to-gray-900/20"></div>
      <div className="absolute top-20 left-10 w-32 h-32 bg-gray-700/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-gray-600/10 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gray-500/10 rounded-full blur-lg"></div>

      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div className="fixed inset-0 bg-black/70 z-40 lg:hidden" onClick={() => setShowSidebar(false)}>
          <div className="absolute right-0 top-0 h-full w-80 bg-black/95 backdrop-blur-lg border-l border-gray-800" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-white text-lg">Menu</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowSidebar(false)}
                  className="text-white hover:bg-gray-800"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800">
                  <MessageSquare className="w-4 h-4 mr-3" />
                  Chat History
                </Button>
                <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800">
                  <Zap className="w-4 h-4 mr-3" />
                  Quick Actions
                </Button>
                <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800">
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
                </Button>
                <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800">
                  <User className="w-4 h-4 mr-3" />
                  Profile
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-black/40 backdrop-blur-lg border-r border-white/10 z-30">
        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-white text-xl mb-2">AI Assistant</h2>
            <p className="text-gray-400 text-sm">Your intelligent companion</p>
          </div>
          
          <div className="space-y-3">
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/5">
              <MessageSquare className="w-4 h-4 mr-3" />
              Chat History
            </Button>
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/5">
              <Zap className="w-4 h-4 mr-3" />
              Quick Actions
            </Button>
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/5">
              <Settings className="w-4 h-4 mr-3" />
              Settings
            </Button>
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/5">
              <User className="w-4 h-4 mr-3" />
              Profile
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-400 hover:bg-red-500/10 hover:text-red-300"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col h-full lg:ml-64">
        {/* Header */}
        <div className="flex items-center justify-between p-4 lg:p-6 relative z-20">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="lg:hidden text-white hover:bg-white/10"
              onClick={() => setShowSidebar(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-white text-lg lg:text-xl">AI Assistant</h1>
          </div>
          
          {showChat && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/10"
              onClick={() => setShowChat(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 relative z-10 px-4 lg:px-6">
          {!showChat ? (
            /* Welcome Screen */
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 lg:space-y-8">
              {/* Globe */}
              <div className="relative group">
                {/* 3D Rotating Rings */}
                <div className="absolute -inset-4 lg:-inset-8 rounded-full border border-gray-500/20 border-t-gray-400/60 border-r-transparent animate-[spin_8s_linear_infinite]"></div>
                <div className="absolute -inset-8 lg:-inset-12 rounded-full border border-gray-600/20 border-b-gray-400/40 border-l-transparent animate-[spin_10s_linear_infinite_reverse]"></div>
                
                <div className="w-32 h-32 lg:w-48 lg:h-48 relative">
                  <img 
                    src={globeImage} 
                    alt="AI Globe"
                    className="w-full h-full object-contain drop-shadow-2xl grayscale brightness-125 animate-[spin_60s_linear_infinite]"
                  />
                  {(isListening || isSpeaking) && (
                    <div className="absolute inset-0 rounded-full border-4 border-gray-400 animate-ping"></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-400/20 to-white/20 rounded-full blur-xl animate-[pulse_4s_ease-in-out_infinite]"></div>
                </div>
              </div>

              {/* Welcome Text */}
              <div className="space-y-2 lg:space-y-4">
                <h2 className="text-2xl lg:text-4xl text-white">Hello there!</h2>
                <p className="text-lg lg:text-xl text-gray-300">I'm your AI assistant</p>
                <p className="text-base lg:text-lg text-gray-400 max-w-md">
                  Ready to help you with questions, tasks, and conversations
                </p>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap gap-3 lg:gap-4 justify-center max-w-lg">
                <Button
                  onClick={() => setShowChat(true)}
                  className="bg-gray-700 hover:bg-gray-600 text-white border-0 px-6 py-3 rounded-full shadow-lg"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Start Chat
                </Button>
                <Button
                  onClick={handleVoiceInput}
                  className={`${isListening ? 'bg-red-600 hover:bg-red-500' : 'bg-gray-600 hover:bg-gray-500'} text-white border-0 px-6 py-3 rounded-full shadow-lg`}
                >
                  {isListening ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                  {isListening ? 'Stop' : 'Voice'}
                </Button>
              </div>
            </div>
          ) : (
            /* Chat Interface */
            <div className="h-full flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-4 pb-4">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Start a conversation...</p>
                  </div>
                )}
                
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <Card className={`max-w-[85%] lg:max-w-[70%] p-4 backdrop-blur-lg border-0 shadow-xl ${
                      message.sender === 'user' 
                        ? 'bg-gray-700 text-white' 
                        : 'bg-white/10 text-white border border-white/10'
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm lg:text-base">{message.text}</p>
                        {message.sender === 'ai' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 h-8 w-8 p-0 text-gray-400 hover:bg-white/10"
                            onClick={() => handleSpeak(message.text)}
                          >
                            <Volume2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </Card>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Chat Input - Always at bottom */}
        <div className="p-4 lg:p-6 relative z-20">
          <Card className="backdrop-blur-lg bg-black/40 border border-white/10 p-4 shadow-xl">
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
                title="Upload Image"
              >
                <ImageIcon className="h-5 w-5" />
              </Button>
              
              <div className="flex-1 relative">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pr-12 rounded-full focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className={`absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 ${
                    isListening ? 'text-red-400' : 'text-gray-400'
                  } hover:bg-white/10`}
                  onClick={handleVoiceInput}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>
              <Button 
                onClick={handleSendMessage} 
                disabled={!inputText.trim()}
                className="bg-white text-black hover:bg-gray-200 border-0 rounded-full px-6 shadow-lg disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {isListening && (
              <div className="mt-3 text-center">
                <p className="text-sm text-gray-300 animate-pulse flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  Listening... Speak now
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                </p>
              </div>
            )}
            
            {isSpeaking && (
              <div className="mt-3 text-center">
                <p className="text-sm text-gray-300 animate-pulse flex items-center justify-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Speaking...
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
