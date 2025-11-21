import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Volume2, Mic, StopCircle, Loader2, Zap, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

// Carrega as variáveis de ambiente do arquivo .env
// require('dotenv').config();

// Importa a classe principal do Google GenAI
// const { GoogleGenAI } = require('@google/genai');

// Obtém a chave de API do arquivo .env

// --- CONFIGURAÇÃO E UTILS DE API/ÁUDIO ---
const CHAT_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";
const TTS_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent";

// Helper para converter base64 em ArrayBuffer
const base64ToArrayBuffer = (base64) => {
    if (!base64) return new ArrayBuffer(0);
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

// Helper para converter PCM em WAV
const pcmToWav = (pcm16, sampleRate) => {
    const numChannels = 1;
    const bytesPerSample = 2; // PCM 16-bit
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const numSamples = pcm16.length;
    const dataSize = numSamples * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    let offset = 0;

    const writeString = (str) => {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset++, str.charCodeAt(i));
        }
    };

    const writeUint32 = (val) => {
        view.setUint32(offset, val, true);
        offset += 4;
    };

    const writeUint16 = (val) => {
        view.setUint16(offset, val, true);
        offset += 2;
    };

    // RIFF header
    writeString('RIFF');
    writeUint32(36 + dataSize); // ChunkSize
    writeString('WAVE');

    // fmt sub-chunk
    writeString('fmt ');
    writeUint32(16); // Subchunk1Size
    writeUint16(1); // AudioFormat (1 for PCM)
    writeUint16(numChannels);
    writeUint32(sampleRate);
    writeUint32(byteRate);
    writeUint16(blockAlign);
    writeUint16(bytesPerSample * 8); // BitsPerSample

    // data sub-chunk
    writeString('data');
    writeUint32(dataSize);

    // Write PCM data
    for (let i = 0; i < numSamples; i++) {
        view.setInt16(offset, pcm16[i], true);
        offset += bytesPerSample;
    }

    return new Blob([view], { type: 'audio/wav' });
};

// --- COMPONENTES DE CHAT ---

const ChatBubble = ({ message, role, onPlay, isPlaying, audioUrl }) => {
    const isUser = role === 'user';
    const bgColor = isUser ? 'bg-indigo-500' : 'bg-gray-100 dark:bg-gray-700';
    const textColor = isUser ? 'text-white' : 'text-gray-900 dark:text-gray-50';
    const alignment = isUser ? 'self-end' : 'self-start';
    const corner = isUser ? 'rounded-br-none' : 'rounded-tl-none';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`max-w-[85%] ${alignment} flex flex-col`}
        >
            <div className={`p-4 shadow-md rounded-xl ${corner} ${bgColor} ${textColor}`}>
                <p className="whitespace-pre-wrap">{message}</p>
                {/* Botão de áudio apenas para a IA */}
                {!isUser && message && (
                    <div className="mt-2 flex justify-end">
                        <button
                            onClick={onPlay}
                            disabled={!audioUrl}
                            className={`p-1.5 rounded-full transition-colors duration-200 ${
                                isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                            } text-white shadow-lg flex items-center`}
                        >
                            {isPlaying ? (
                                <StopCircle className="w-5 h-5" />
                            ) : (
                                <Volume2 className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// --- FUNÇÃO DE BUSCA E GERAÇÃO DE ÁUDIO DA IA ---

const getAiResponseAndAudio = async (history, currentMessage) => {
    const chatHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));

    // Adiciona a mensagem atual do usuário ao histórico para a chamada da API
    chatHistory.push({ role: 'user', parts: [{ text: currentMessage }] });

    const systemPrompt = "Você é um professor de inglês amigável e encorajador. Mantenha as respostas curtas (máximo 3 frases), focadas em manter uma conversa simples ou corrigir o usuário. Responda APENAS em inglês, a menos que o usuário pergunte algo diretamente em português.";

    const chatPayload = {
        contents: chatHistory,
        systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    const chatResponse = await fetch(`${CHAT_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatPayload)
    });
    const chatResult = await chatResponse.json();
    const aiText = chatResult?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
        throw new Error("Não foi possível obter resposta da IA.");
    }

    // 2. Geração de Áudio (TTS)
    const ttsPayload = {
        contents: [{ parts: [{ text: aiText }] }],
        generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: "Kore" } // Voz Firme e clara
                }
            }
        },
    };

    const ttsResponse = await fetch(`${TTS_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ttsPayload)
    });

    const ttsResult = await ttsResponse.json();
    const part = ttsResult?.candidates?.[0]?.content?.parts?.[0];
    const audioData = part?.inlineData?.data;
    const mimeType = part?.inlineData?.mimeType;

    if (audioData && mimeType && mimeType.startsWith("audio/L16")) {
        const sampleRateMatch = mimeType.match(/rate=(\d+)/);
        const sampleRate = sampleRateMatch ? parseInt(sampleRateMatch[1], 10) : 24000;
        const pcmData = base64ToArrayBuffer(audioData);
        const pcm16 = new Int16Array(pcmData);
        const wavBlob = pcmToWav(pcm16, sampleRate);
        const audioUrl = URL.createObjectURL(wavBlob);
        return { aiText, audioUrl };
    }

    // Retorna o texto mesmo que o áudio falhe
    return { aiText, audioUrl: null };
};

// --- COMPONENTE PRINCIPAL ---

export default function SpeakWithIA() {
    const [messages, setMessages] = useState([{
        role: 'model',
        text: "Hi! I'm your English practice partner. What would you like to talk about today?",
        audioUrl: null, // Será gerado na primeira reprodução
        isPlaying: false,
    }]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [currentAudio, setCurrentAudio] = useState(null); // Ref para o objeto Audio
    const chatEndRef = useRef(null);
    const RecognitionRef = useRef(null);

    // Efeito para rolar para o final
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Função para tocar o áudio
    const handlePlayAudio = (audioUrl, index) => {
        // Se já houver um áudio tocando, pare-o
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            // Reseta o estado de reprodução
            setMessages(prev => prev.map((msg, i) => ({ ...msg, isPlaying: false })));
        }

        if (currentAudio && currentAudio.src === audioUrl && messages[index].isPlaying) {
            // Se for o mesmo áudio e estiver tocando, apenas paramos e resetamos
            setCurrentAudio(null);
            return;
        }

        const audio = new Audio(audioUrl);
        setCurrentAudio(audio);
        
        // Define o estado de reprodução para o balão correto
        setMessages(prev => prev.map((msg, i) => ({ 
            ...msg, 
            isPlaying: i === index ? true : false 
        })));

        audio.play().catch(e => console.error("Erro ao tocar áudio:", e));

        audio.onended = () => {
            setCurrentAudio(null);
            setMessages(prev => prev.map((msg, i) => ({ ...msg, isPlaying: false })));
        };
    };

    // Função principal de envio de mensagem
    const handleSendMessage = useCallback(async (text) => {
        if (!text.trim() || isLoading) return;

        // 1. Adiciona a mensagem do usuário
        const userMessage = { role: 'user', text: text.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // 2. Obtém a resposta da IA e o URL do áudio
            const { aiText, audioUrl } = await getAiResponseAndAudio(messages, text.trim());
            
            // 3. Adiciona a resposta da IA
            const aiMessage = { 
                role: 'model', 
                text: aiText, 
                audioUrl: audioUrl,
                isPlaying: false
            };
            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            console.error("Erro ao comunicar com a IA:", error);
            setMessages(prev => [...prev, {
                role: 'model',
                text: "Desculpe, houve um erro ao processar sua requisição. Tente novamente mais tarde.",
                audioUrl: null,
                isPlaying: false
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, messages]);

    // --- LÓGICA DE SPEECH-TO-TEXT (STT) ---
    
    // Inicializa ou obtém a instância de SpeechRecognition
    const getRecognitionInstance = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Seu navegador não suporta Reconhecimento de Fala. Use a digitação.');
            return null;
        }
        if (!RecognitionRef.current) {
            const recognition = new SpeechRecognition();
            recognition.lang = 'en-US'; // Língua alvo para prática
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setIsListening(false);
                handleSendMessage(transcript); // Envia a transcrição como mensagem
            };

            recognition.onerror = (event) => {
                console.error('Erro de Reconhecimento de Fala:', event.error);
                alert(`Erro de Microfone: ${event.error}. Tente novamente.`);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            RecognitionRef.current = recognition;
        }
        return RecognitionRef.current;
    };

    const startListening = () => {
        if (isLoading) return;

        const recognition = getRecognitionInstance();
        if (recognition) {
            try {
                recognition.start();
                setIsListening(true);
            } catch (e) {
                console.error("Erro ao iniciar o microfone:", e);
                setIsListening(false);
                alert('Não foi possível iniciar o microfone. Verifique as permissões.');
            }
        }
    };

    const stopListening = () => {
        const recognition = RecognitionRef.current;
        if (recognition) {
            recognition.stop();
            setIsListening(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSendMessage(input);
        }
    };
    
    const resetConversation = () => {
        if (window.confirm("Deseja realmente reiniciar a conversa?")) {
            setMessages([{
                role: 'model',
                text: "Hi! I'm your English practice partner. What would you like to talk about today?",
                audioUrl: null,
                isPlaying: false,
            }]);
            setInput('');
            setIsLoading(false);
            stopListening();
            if (currentAudio) {
                currentAudio.pause();
                setCurrentAudio(null);
            }
        }
    }


    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            
            {/* Header */}
            <header className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <h1 className="text-xl font-extrabold text-[#9eed15] flex items-center">
                    <Zap className="w-5 h-5 mr-2" /> Speak with IA
                </h1>
                <button 
                    onClick={resetConversation}
                    className="p-2 rounded-full text-gray-500 hover:text-red-500 hover:bg-gray-100 transition duration-200"
                    title="Reiniciar Conversa"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>
            </header>

            {/* Chat Messages */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <ChatBubble 
                        key={index} 
                        message={msg.text} 
                        role={msg.role} 
                        audioUrl={msg.audioUrl}
                        isPlaying={msg.isPlaying}
                        onPlay={() => handlePlayAudio(msg.audioUrl, index)}
                    />
                ))}

                {/* Typing Indicator */}
                {isLoading && (
                    <div className="self-start max-w-[85%]">
                        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl rounded-tl-none flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>IA está digitando...</span>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                <div className="flex space-x-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isListening ? "Fale agora..." : "Digite sua mensagem ou use o microfone..."}
                        disabled={isLoading || isListening}
                        className={`flex-1 p-3 border-2 rounded-xl focus:ring-4 transition duration-200 focus:outline-none ${
                            isListening ? 'border-indigo-500 ring-indigo-200 bg-indigo-50' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-100'
                        } dark:bg-gray-800 dark:border-gray-600 dark:text-white`}
                    />

                    {/* Botão de Microfone */}
                    <motion.button
                        onClick={isListening ? stopListening : startListening}
                        disabled={isLoading}
                        whileTap={{ scale: 0.95 }}
                        className={`p-3 rounded-xl transition-all duration-300 ${
                            isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-[#9eed15] hover:bg-green-600'
                        } text-white shadow-lg`}
                        title={isListening ? "Parar de Falar" : "Iniciar Reconhecimento de Voz"}
                    >
                        {isListening ? <StopCircle className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </motion.button>
                    
                    {/* Botão de Envio */}
                    <motion.button
                        onClick={() => handleSendMessage(input)}
                        disabled={!input.trim() || isLoading || isListening}
                        whileTap={{ scale: 0.95 }}
                        className={`p-3 rounded-xl transition-all duration-300 ${
                            !input.trim() || isLoading || isListening ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600'
                        } text-white shadow-lg`}
                        title="Enviar Mensagem"
                    >
                        <Send className="w-6 h-6" />
                    </motion.button>
                </div>
            </div>
        </div>
    );
}