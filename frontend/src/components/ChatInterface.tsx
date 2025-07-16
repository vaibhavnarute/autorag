import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Image, Upload, FileText, Download, ExternalLink, Bot, User, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import FileUpload from './FileUpload';
import { useLanguage } from '../hooks/useLanguage';
import FollowupSuggestions from './FollowupSuggestions';
import PromptEditor from './PromptEditor';

const ChatInterface = ({ project }) => {
  const { language } = useLanguage();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: `Hello! I'm ready to help you analyze the documents in "${project.name}". You can ask me questions about the content, request summaries, or explore specific topics. What would you like to know?`,
      timestamp: new Date(),
      sources: []
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [promptTemplate, setPromptTemplate] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef(null);
  const [showAskModel, setShowAskModel] = useState(false);
  const [askModelPos, setAskModelPos] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [speakingId, setSpeakingId] = useState(null); // Track which message is speaking

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [messages]);

  // TTS: Play answer aloud
  const speak = (text) => {
    if (!('speechSynthesis' in window)) return;

    // If already speaking, stop
    if (window.speechSynthesis.speaking || isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    utteranceRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // STT: Start/stop recording
  const toggleRecording = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser.');
      return;
    }
    if (isRecording) {
      recognitionRef.current && recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
      };
      recognition.onend = () => setIsRecording(false);
      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    }
  };

  // Simulate streaming UI for chat responses
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      sources: []
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setStreamingText('');
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          question: inputValue,
          history: messages.map(m => ({ role: m.type === 'user' ? 'user' : 'ai', content: m.content })),
          language,
          prompt_template: promptTemplate || `You are an expert assistant. Answer in ${language}. Use the provided document chunks to answer the user's question. Cite sources using [chunk_index] where relevant.\n\nContext:\n{context}\n\nChat History:\n{history}\n\nQuestion: {question}\n\nAnswer:`
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Simulate streaming
      let i = 0;
      setStreamingText('');
      const interval = setInterval(() => {
        setStreamingText(data.answer.slice(0, i));
        i += 5;
        if (i > data.answer.length) {
          clearInterval(interval);
          setMessages(prev => [
            ...prev,
            { id: prev.length + 1, type: 'ai', content: data.answer, timestamp: new Date(), sources: data.sources || [], followups: data.followups || [] },
          ]);
          setStreamingText('');
          setIsLoading(false);
        }
      }, 30);
    } catch (error) {
      console.error('Error fetching or parsing data:', error);
      // Optionally show an error message to the user
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSendImage = async () => {
    if (!imageFile) return;
    setIsLoading(true);
    const formData = new FormData();
    formData.append('project_id', project.id);
    formData.append('image', imageFile);
    formData.append('language', language);
    formData.append('prompt_template', `You are an expert assistant. Answer in ${language}. Use the provided document chunks to answer the user's question. Cite sources using [chunk_index] where relevant.\n\nContext:\n{context}\n\nChat History:\n{history}\n\nQuestion: {question}\n\nAnswer:`);
    formData.append('history', JSON.stringify(messages.map(m => ({ role: m.type === 'user' ? 'user' : 'ai', content: m.content }))));
    const response = await fetch('/api/chat/image', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    setMessages(prev => [
      ...prev,
      { id: prev.length + 1, type: 'user', content: `[Image uploaded]`, image: imagePreview, timestamp: new Date(), sources: [] },
      { id: prev.length + 2, type: 'ai', content: data.answer, ocr: data.ocr_text, timestamp: new Date(), sources: data.sources || [] },
    ]);
    setImageFile(null);
    setImagePreview(null);
    setIsLoading(false);
  };

  const suggestedQuestions = [
    "Summarize the key findings from all documents",
    "What are the main compliance requirements?",
    "Compare the different approaches mentioned",
    "Extract all important dates and deadlines"
  ];

  const handleMouseUp = (e) => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      setAskModelPos({ x: rect.right, y: rect.top });
      setSelectedText(selection.toString());
      setShowAskModel(true);
    } else {
      setShowAskModel(false);
    }
  };

  const openAskModelModal = (text) => {
    setInputValue(text);
    setShowAskModel(false);
  };

  return (
    <div className="flex h-[calc(100vh-80px)]">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message, idx) => (
              <React.Fragment key={message.id}>
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-3xl ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                      message.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    }`}>
                      {message.type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    
                    <div className={`flex-1 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className={`inline-block p-4 rounded-2xl max-w-full ${
                        message.type === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white shadow-sm border'
                      }`}>
                        {/* Image preview for user image uploads */}
                        {message.image && (
                          <div className="mb-2 flex justify-center">
                            <img src={message.image} alt="User upload" className="max-h-40 rounded shadow" />
                          </div>
                        )}
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        {/* OCR text for AI messages */}
                        {message.ocr && (
                          <div className="mt-2 p-2 bg-gray-50 border rounded text-xs text-gray-700">
                            <strong>OCR Text:</strong> {message.ocr}
                          </div>
                        )}
                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm font-medium text-gray-700 mb-2">Sources:</p>
                            <div className="flex flex-wrap gap-2">
                              {message.sources.map((source, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {source.name ? `${source.name}` : ''} {source.page ? `(p.${source.page})` : ''}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  {/* Follow-up suggestions after last AI message */}
                  {message.type === 'ai' && message.followups && idx === messages.length - 1 && (
                    <FollowupSuggestions
                      suggestions={message.followups}
                      onSelect={q => setInputValue(q)}
                    />
                  )}
                </div>
                {message.type === 'ai' && (
                  <div className="flex justify-start">
                    <div className="flex gap-3 max-w-3xl">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-white shadow-sm border rounded-2xl p-4">
                        <div onMouseUp={handleMouseUp}>{message.content}</div>
                        {showAskModel && (
                          <div style={{ position: 'fixed', top: askModelPos.y, left: askModelPos.x, zIndex: 1000 }}>
                            <Button onClick={() => openAskModelModal(selectedText)}>Ask Model</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {message.type === 'ai' && (
                  <div className="flex justify-start">
                    <div className="flex gap-3 max-w-3xl">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-white shadow-sm border rounded-2xl p-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(message.content);
                            // Assuming toast is available, otherwise remove or import
                            // toast('Copied!'); 
                          }}
                          aria-label="Copy response"
                        >
                          <span role="img" aria-label="copy">📋</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {message.type === 'ai' && (
                  <div className="flex justify-start">
                    <div className="flex gap-3 max-w-3xl">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-white shadow-sm border rounded-2xl p-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            speak(message.content);
                            setSpeakingId(message.id); // Track which message is speaking
                          }}
                          className={`h-8 w-8 p-0 ${isSpeaking && speakingId === message.id ? 'text-blue-500' : 'text-gray-400'}`}
                          aria-label={isSpeaking && speakingId === message.id ? "Stop speaking" : "Play answer aloud"}
                        >
                          {isSpeaking && speakingId === message.id ? <span role="img" aria-label="stop">⏹️</span> : <span role="img" aria-label="speaker">🔊</span>}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
            {/* Streaming UI for partial answer */}
            {streamingText && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-3xl">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-white shadow-sm border rounded-2xl p-4">
                    <span className="text-gray-600 whitespace-pre-wrap">{streamingText}</span>
                  </div>
                </div>
              </div>
            )}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-3xl">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-white shadow-sm border rounded-2xl p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-gray-600">Analyzing documents...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div className="p-6 border-t bg-gray-50/50">
            <div className="max-w-4xl mx-auto">
              <p className="text-sm font-medium text-gray-700 mb-3">Suggested questions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => setInputValue(question)}
                    className="text-left text-xs hover:bg-blue-50 hover:border-blue-200"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-6 border-t bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question about your documents..."
                  className="pr-12 min-h-[44px] resize-none"
                  disabled={isLoading}
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleRecording}
                    className={`h-8 w-8 p-0 ${isRecording ? 'text-red-500' : 'text-gray-400'}`}
                    aria-label="Record voice"
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                id="chat-image-upload"
                onChange={handleImageInput}
              />
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400"
                aria-label="Upload image for chat"
                disabled={isLoading}
              >
                <label htmlFor="chat-image-upload">
                  <Image className="h-4 w-4" />
                </label>
              </Button>
              {imageFile && (
                <Button
                  onClick={handleSendImage}
                  size="sm"
                  className="h-8 px-2 text-xs"
                  disabled={isLoading}
                >
                  Send Image
                </Button>
              )}
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-11 px-6"
              >
                <Send className="h-4 w-4" />
              </Button>
              {/* Speaker button for TTS on last AI message */}
              {messages.length > 1 && messages[messages.length - 1].type === 'ai' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => speak(messages[messages.length - 1].content)}
                  className={`h-8 w-8 p-0 ${isSpeaking ? 'text-blue-500' : 'text-gray-400'}`}
                  aria-label={isSpeaking ? "Stop speaking" : "Play answer aloud"}
                >
                  {isSpeaking ? <span role="img" aria-label="stop">⏹️</span> : <span role="img" aria-label="speaker">🔊</span>}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 border-l bg-white/50 backdrop-blur-sm">
        <div className="p-6">
          {/* Project Info */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{project.name}</CardTitle>
              <p className="text-sm text-gray-600">{project.description}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Documents</span>
                  <p className="font-semibold">{project.documentCount}</p>
                </div>
                <div>
                  <span className="text-gray-500">Last Used</span>
                  <p className="font-semibold">{project.lastUsed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-3 mb-6">
            <Button 
              onClick={() => setShowFileUpload(!showFileUpload)}
              variant="outline" 
              className="w-full justify-start"
            >
              <Upload className="h-4 w-4 mr-2" />
              Add Documents
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Download className="h-4 w-4 mr-2" />
              Export Chat
            </Button>
          </div>

          {showFileUpload && (
            <div className="mb-6">
              <FileUpload onUpload={(files) => console.log('Files uploaded:', files)} />
            </div>
          )}

          {/* Recent Documents */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Recent Documents</h3>
            <div className="space-y-2">
              {[
                { name: 'Research_Paper_AI.pdf', size: '2.3 MB', status: 'processed' },
                { name: 'Company_Handbook.docx', size: '1.8 MB', status: 'processed' },
                { name: 'Legal_Contract.pdf', size: '956 KB', status: 'processing' }
              ].map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg border bg-gray-50/50">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-gray-500">{doc.size}</p>
                    </div>
                  </div>
                  <Badge variant={doc.status === 'processed' ? 'default' : 'secondary'} className="text-xs">
                    {doc.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Prompt Editor Modal Button */}
      <div className="p-2 flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setShowPromptEditor(true)}>
          Edit Prompt Template
        </Button>
      </div>
      {showPromptEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <PromptEditor
            value={promptTemplate}
            onChange={setPromptTemplate}
            onSave={() => setShowPromptEditor(false)}
          />
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
