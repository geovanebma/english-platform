import React, { useState, useEffect, useRef } from "react";
import {
  Zap,
  RotateCcw,
  Loader2,
  Mic,
  StopCircle,
  Send,
  Volume2
} from "lucide-react";
// import "./SpeakWithAI.css";

// Sub-componente para as bolhas de chat
const ChatBubble = ({ message, role, audioUrl, isPlaying, onPlay }) => (
  <div className={`chat-bubble-container ${role}`}>
    <div className={`chat-bubble ${role}`}>
      <p>{message}</p>
      {audioUrl && (
        <button 
          onClick={onPlay} 
          className={`audio-btn ${isPlaying ? 'playing' : ''}`}
        >
          <Volume2 size={16} />
        </button>
      )}
    </div>
  </div>
);

export default function SpeakWithAI({
  messages,
  isLoading,
  isListening,
  input,
  setInput,
  resetConversation,
  startListening,
  stopListening,
  handleSendMessage,
  handlePlayAudio,
}) {
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && input.trim() && !isLoading && !isListening) {
      handleSendMessage(input);
    }
  };

  return (
    <div className="speak-container">
      {/* Header */}
      <header className="speak-header">
        <h1 className="header-title">
          <Zap className="icon-zap" size={20} />
          Speak with AI
        </h1>
        <button
          onClick={resetConversation}
          className="reset-btn"
          title="Reiniciar Conversa"
        >
          <RotateCcw size={20} />
        </button>
      </header>

      {/* Chat area */}
      <div className="chat-area">
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg.text}
            role={msg.role}
            audioUrl={msg.audioUrl}
            isPlaying={msg.isPlaying}
            onPlay={() => msg.audioUrl && handlePlayAudio(msg.audioUrl, msg.id)}
          />
        ))}

        {isLoading && (
          <div className="loading-indicator">
            <Loader2 className="spinner" size={16} />
            <span>IA está digitando...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div className="input-section">
        <div className="input-group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Fale agora..." : "Digite sua mensagem..."}
            disabled={isLoading || isListening}
            className={`text-input ${isListening ? "listening-mode" : ""}`}
          />

          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isLoading}
            className={`action-btn mic-btn ${isListening ? "active" : ""}`}
          >
            {isListening ? <StopCircle size={24} /> : <Mic size={24} />}
          </button>

          <button
            onClick={() => handleSendMessage(input)}
            disabled={!input.trim() || isLoading || isListening}
            className="action-btn send-btn"
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}