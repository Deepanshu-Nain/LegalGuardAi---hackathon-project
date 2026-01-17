import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Mic, MicOff, Send, Settings, Menu, X, MessageSquare, Zap, Volume2, User, FileText, LogOut, BarChart3 } from 'lucide-react';
import { ChatInterface } from './ChatInterface';
import { AnalysisPage } from './AnalysisPage';
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
  const [showChat, setShowChat] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [currentView, setCurrentView] = useState<'chat' | 'analysis' | 'documents' | 'settings'>('chat');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [currentDocument, setCurrentDocument] = useState<{
    fullText: string;
    highlights: Array<{start: number, end: number, label: string, confidence: number}>;
    topClassification: {label: string, confidence: number, modelUsed: string};
  } | null>(null);
  const [showDocumentView, setShowDocumentView] = useState(false);

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
    // Return empty string since we're relying on the analysis from the backend
    return "";
  };

  const handleLogout = () => {
    // Clear chat history by resetting messages to empty state
    setMessages([]);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if it's a PDF, DOCX, or DOC
      const allowedTypes = [
        'application/pdf', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
      ];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF, DOC, or DOCX file only.');
        return;
      }

      // Add user message about uploading
      const uploadMessage: Message = {
        id: Date.now().toString(),
        text: `Uploading document: ${file.name}`,
        sender: 'user',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, uploadMessage]);
      setShowChat(true);

      try {
        // Create FormData and send to backend
        const formData = new FormData();
        formData.append('document', file);

        const response = await fetch('http://localhost:3001/api/process-document', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (result.success) {
          // Store the document data
          setCurrentDocument({
            fullText: result.fullText,
            highlights: result.highlights,
            topClassification: result.topClassification
          });

          // Add AI response with classification
          const modelInfo = result.topClassification.modelUsed ? ` (using ${result.topClassification.modelUsed})` : '';
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: `I've analyzed your document "${file.name}". Based on AI analysis${modelInfo}, this document appears to be classified as: **${result.topClassification.label}** with ${(result.topClassification.confidence * 100).toFixed(2)}% confidence.\n\nYou can now ask questions about this document or view the highlighted analysis.`,
            sender: 'ai',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
        } else {
          // Add error message
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: `Sorry, I couldn't process your document. Error: ${result.message}`,
            sender: 'ai',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      } catch (error) {
        console.error('Error uploading document:', error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Sorry, there was an error processing your document. Please try again.',
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setShowChat(true);

    // Clear input
    setInputText('');

    try {
      let apiPayload = { text: inputText };
      
      // If we have a current document, include it for context
      if (currentDocument) {
        apiPayload = {
          ...apiPayload,
          documentContext: currentDocument.fullText.substring(0, 1000), // Include first 1000 chars for context
          highlights: currentDocument.highlights
        };
      }

      // Call the Hugging Face Space for analysis
      const response = await fetch('http://localhost:3004/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiPayload)
      });

      const result = await response.json();

      if (result.success) {
        // Add AI response
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: result.response,
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        // Add error message
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: `Sorry, I couldn't process your request. Error: ${result.message}`,
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, there was an error processing your request. Please try again.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
    } else {
      recognition?.start();
      setIsListening(true);
    }
  };

  const handleSpeak = (text: string) => {
    if (speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
    }
  };

  return (
    <>
      <style>
        {`
          .main-content {
            overflow-y: auto;
            scrollbar-width: thin;
          }
          
          .main-content::-webkit-scrollbar {
            width: 12px;
            position: absolute;
            right: 0;
          }
          
          .main-content::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 6px;
          }
          
          .main-content::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 6px;
            border: 2px solid rgba(0, 0, 0, 0.1);
          }
          
          .main-content::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.5);
          }
          
          /* Ensure chat messages don't have their own scroll */
          .chat-messages {
            overflow-y: visible !important;
            max-height: none !important;
          }
        `}
      </style>
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
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start ${currentView === 'chat' ? 'bg-white/10 text-white' : 'text-white hover:bg-gray-800'}`}
                  onClick={() => { setCurrentView('chat'); setShowSidebar(false); }}
                >
                  <MessageSquare className="w-4 h-4 mr-3" />
                  Chat
                </Button>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start ${currentView === 'analysis' ? 'bg-white/10 text-white' : 'text-white hover:bg-gray-800'}`}
                  onClick={() => { setCurrentView('analysis'); setShowSidebar(false); }}
                >
                  <BarChart3 className="w-4 h-4 mr-3" />
                  Analysis
                </Button>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start ${currentView === 'documents' ? 'bg-white/10 text-white' : 'text-white hover:bg-gray-800'}`}
                  onClick={() => { setCurrentView('documents'); setShowSidebar(false); }}
                >
                  <FileText className="w-4 h-4 mr-3" />
                  Documents
                </Button>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start ${currentView === 'settings' ? 'bg-white/10 text-white' : 'text-white hover:bg-gray-800'}`}
                  onClick={() => { setCurrentView('settings'); setShowSidebar(false); }}
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
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
            <h2 className="text-white text-xl mb-2">Legal Analyzer</h2>
            <p className="text-gray-400 text-sm">Document Analysis Tool</p>
          </div>
          
          <div className="space-y-3">
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${currentView === 'chat' ? 'bg-white/10 text-white' : 'text-white hover:bg-white/5'}`}
              onClick={() => setCurrentView('chat')}
            >
              <MessageSquare className="w-4 h-4 mr-3" />
              Chat
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${currentView === 'analysis' ? 'bg-white/10 text-white' : 'text-white hover:bg-white/5'}`}
              onClick={() => setCurrentView('analysis')}
            >
              <BarChart3 className="w-4 h-4 mr-3" />
              Analysis
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${currentView === 'documents' ? 'bg-white/10 text-white' : 'text-white hover:bg-white/5'}`}
              onClick={() => setCurrentView('documents')}
            >
              <FileText className="w-4 h-4 mr-3" />
              Documents
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${currentView === 'settings' ? 'bg-white/10 text-white' : 'text-white hover:bg-white/5'}`}
              onClick={() => setCurrentView('settings')}
            >
              <Settings className="w-4 h-4 mr-3" />
              Settings
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
      <div className="flex flex-col h-full lg:ml-64 main-content bg-white text-black">
        {/* Header */}
        <div className="flex items-center justify-between p-4 lg:p-6 relative z-20">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="lg:hidden hover:bg-gray-200"
              onClick={() => setShowSidebar(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg lg:text-xl">
              {currentView === 'chat' ? 'AI Assistant' : 
               currentView === 'analysis' ? 'Analysis' : 
               currentView === 'documents' ? 'Documents' : 
               currentView === 'settings' ? 'Settings' : 'AI Assistant'}
            </h1>
          </div>
          
          {showChat && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="hover:bg-gray-200"
              onClick={() => setShowChat(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 relative z-10 px-4 lg:px-6">
          {currentView === 'chat' && showDocumentView && currentDocument ? (
            /* Document View */
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg">Document Analysis</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hover:bg-gray-200"
                  onClick={() => setShowDocumentView(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto bg-gray-100 rounded-lg p-4">
                <div className="mb-4 p-4 bg-gray-200 rounded-lg">
                  <h4 className="font-semibold mb-2">Overall Classification</h4>
                  <p className="text-black">
                    <strong>{currentDocument.topClassification.label}</strong> 
                    ({(currentDocument.topClassification.confidence * 100).toFixed(2)}% confidence)
                  </p>
                  <p className="text-black text-sm">Model: {currentDocument.topClassification.modelUsed}</p>
                </div>
                
                <div className="whitespace-pre-wrap leading-relaxed">
                  {currentDocument.fullText.split('').map((char, index) => {
                    const highlight = currentDocument.highlights.find(h => index >= h.start && index < h.end);
                    return highlight ? (
                      <span 
                        key={index} 
                        className="bg-yellow-500/30 border-b-2 border-yellow-400 cursor-pointer"
                        title={`${highlight.label} (${(highlight.confidence * 100).toFixed(1)}%)`}
                      >
                        {char}
                      </span>
                    ) : char;
                  })}
                </div>
              </div>
            </div>
          ) : currentView === 'chat' && !showChat ? (
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
                <h2 className="text-2xl lg:text-4xl">Legal Document Analyzer</h2>
                <p className="text-lg lg:text-xl text-black">AI-Powered Analysis</p>
                <p className="text-base lg:text-lg text-gray-800 max-w-md">
                  Upload documents or enter text for intelligent legal clause analysis
                </p>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap gap-3 lg:gap-4 justify-center max-w-lg">
                <Button
                  onClick={() => setShowChat(true)}
                  className="bg-gray-200 hover:bg-gray-300 text-black border-0 px-6 py-3 rounded-full shadow-lg"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Start Chat
                </Button>
                <Button
                  onClick={handleVoiceInput}
                  className={`${isListening ? 'bg-red-600 hover:bg-red-500' : 'bg-gray-300 hover:bg-gray-400'} text-black border-0 px-6 py-3 rounded-full shadow-lg`}
                >
                  {isListening ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                  {isListening ? 'Stop' : 'Voice'}
                </Button>
                {currentDocument && (
                  <Button
                    onClick={() => setShowDocumentView(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white border-0 px-6 py-3 rounded-full shadow-lg"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Analysis
                  </Button>
                )}
              </div>
            </div>
          ) : currentView === 'chat' ? (
            /* Chat Interface */
            <div className="h-full flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 mb-4 space-y-4 pb-4">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-black">Start a conversation...</p>
                  </div>
                )}
                
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <Card className={`max-w-[85%] lg:max-w-[70%] p-4 backdrop-blur-lg border-0 shadow-xl ${
                      message.sender === 'user' 
                        ? 'bg-blue-100 text-black' 
                        : 'bg-gray-100 text-black border border-gray-300'
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm lg:text-base font-bold">{message.text}</p>
                        {message.sender === 'ai' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 h-8 w-8 p-0 text-black hover:bg-gray-200"
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
          ) : currentView === 'analysis' ? (
            /* Analysis Interface */
            <AnalysisPage />
          ) : currentView === 'documents' ? (
            /* Documents View */
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <FileText className="w-16 h-16 text-black" />
              <h2 className="text-2xl">Documents</h2>
              <p className="text-black">Document management coming soon...</p>
            </div>
          ) : currentView === 'settings' ? (
            /* Settings View */
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <Settings className="w-16 h-16 text-black" />
              <h2 className="text-2xl">Settings</h2>
              <p className="text-black">Settings panel coming soon...</p>
            </div>
          ) : null}
        </div>

        {/* Chat Input - Show for chat and analysis views */}
        {(currentView === 'chat' || currentView === 'analysis') && (
          <div className="p-4 lg:p-6 relative z-20">
          <Card className="backdrop-blur-lg bg-white border border-gray-300 p-4 shadow-xl">
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="text-black hover:bg-gray-200 rounded-full"
                title="Upload File"
                onClick={handleFileUpload}
              >
                <FileText className="h-5 w-5" />
              </Button>
              
              {currentDocument && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-black hover:bg-gray-200 rounded-full"
                  title="View Document Analysis"
                  onClick={() => setShowDocumentView(true)}
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
              )}
              
              <div className="flex-1 relative">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Input"
                  className="bg-gray-100 border-gray-300 text-black placeholder:text-gray-500 pr-12 rounded-full focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className={`absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 ${
                    isListening ? 'text-red-400' : 'text-black'
                  } hover:bg-gray-200`}
                  onClick={handleVoiceInput}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>
              <Button 
                onClick={handleSendMessage} 
                disabled={!inputText.trim()}
                className="bg-blue-500 text-white hover:bg-blue-600 border-0 rounded-full px-6 shadow-lg disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx"
                style={{ display: 'none' }}
              />
            </div>
            
            {isListening && (
              <div className="mt-3 text-center">
                <p className="text-sm text-black animate-pulse flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  Listening... Speak now
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                </p>
              </div>
            )}
            
            {isSpeaking && (
              <div className="mt-3 text-center">
                <p className="text-sm text-black animate-pulse flex items-center justify-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Speaking...
                </p>
              </div>
            )}
          </Card>
        </div>
        )}
      </div>
    </div>
    </>
  );
}
