import React, { useState } from 'react';
import { Volume2, Loader2, Zap } from 'lucide-react';

// Variáveis Globais: Manter apiKey vazia, o ambiente de execução irá injetar se necessário.
const apiKey = ""; 
// A URL base da API
const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent";

// Helper para converter base64 em ArrayBuffer
const base64ToArrayBuffer = (base64) => {
    // Garantir que a string base64 é válida antes de tentar decodificar
    if (!base64) return new ArrayBuffer(0);
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

// Helper para converter PCM em WAV (necessário para o áudio)
const pcmToWav = (pcm16, sampleRate) => {
    const numChannels = 1;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const numSamples = pcm16.length;
    const dataSize = numSamples * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    
    // RIFF identifier 'RIFF'
    view.setUint32(0, 0x52494646, false);
    // file size (36 + data size)
    view.setUint32(4, 36 + dataSize, true);
    // WAVE identifier 'WAVE'
    view.setUint32(8, 0x57415645, false);
    // format chunk identifier 'fmt '
    view.setUint32(12, 0x666d7420, false);
    // format chunk length 16
    view.setUint32(16, 16, true);
    // sample format (raw PCM) 1
    view.setUint16(20, 1, true);
    // channel count 1
    view.setUint16(22, numChannels, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (SampleRate * NumChannels * BitsPerSample/8)
    view.setUint32(28, byteRate, true);
    // block align (NumChannels * BitsPerSample/8)
    view.setUint16(32, blockAlign, true);
    // bits per sample 16
    view.setUint16(34, 16, true);
    // data chunk identifier 'data'
    view.setUint32(36, 0x64617461, false);
    // data chunk length
    view.setUint32(40, dataSize, true);
    
    // Write the PCM data
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
        view.setInt16(offset, pcm16[i], true);
        offset += 2;
    }
    
    return new Blob([view], { type: 'audio/wav' });
};

// Função de API principal
const generateAudio = async (text, voiceName) => {
    // Constrói a URL para garantir que a chave seja adicionada corretamente
    const apiUrl = `${API_BASE_URL}?key=${apiKey}`;

    const payload = {
        contents: [{
            parts: [{ text: text }]
        }],
        generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceName || "Kore" } // Voz padrão 'Kore'
                }
            }
        },
        model: "gemini-2.5-flash-preview-tts"
    };

    let response;
    // Implementação de Backoff Exponencial
    for (let i = 0; i < 3; i++) {
        try {
            response = await fetch(apiUrl, { // Usa a variável apiUrl
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                const part = result?.candidates?.[0]?.content?.parts?.[0];
                const audioData = part?.inlineData?.data;
                const mimeType = part?.inlineData?.mimeType;

                if (audioData && mimeType && mimeType.startsWith("audio/")) {
                    // Tenta extrair a taxa de amostragem, caso contrário usa 16000
                    const sampleRateMatch = mimeType.match(/rate=(\d+)/);
                    const sampleRate = sampleRateMatch ? parseInt(sampleRateMatch[1], 10) : 16000; 
                    const pcmData = base64ToArrayBuffer(audioData);
                    const pcm16 = new Int16Array(pcmData);
                    const wavBlob = pcmToWav(pcm16, sampleRate);
                    return URL.createObjectURL(wavBlob);
                }
                return null;
            } else if (response.status === 429) {
                console.warn(`Rate limit exceeded. Retrying in ${2 ** i}s...`);
                await new Promise(resolve => setTimeout(resolve, (2 ** i) * 1000));
            } else {
                // Lança um erro para o bloco catch
                const errorBody = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorBody}`);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            if (i === 2) throw error; 
            await new Promise(resolve => setTimeout(resolve, (2 ** i) * 1000));
        }
    }
    return null;
};


// Componente principal
function ListeningPage({ setCurrentView }) {
    const [text, setText] = useState('Welcome to the listening module. Click the button to generate and play this sentence.');
    const [audioUrl, setAudioUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const handleGenerateAndPlay = async () => {
        if (!text) return;

        setLoading(true);
        setAudioUrl(null);
        setError(null); // Limpa erros anteriores

        try {
            const url = await generateAudio(text, 'Zephyr'); // Usando a voz 'Zephyr' (Bright)
            if (url) {
                setAudioUrl(url);
                const audio = new Audio(url);
                audio.play();
            } else {
                setError('Erro ao gerar áudio. Verifique o console para detalhes.');
            }
        } catch (err) {
            console.error("Failed to generate audio:", err);
            setError('Falha crítica ao conectar com a API de áudio. (403 Forbidden geralmente indica problema na chave).');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-4xl font-extrabold text-[#F1C40F]">Módulo: Listening (Ouvir e Compreender)</h1>
                <button 
                    onClick={() => setCurrentView('initial')} 
                    className="bg-gray-800 text-white px-5 py-2 rounded-lg font-bold hover:bg-gray-700 transition-colors"
                >
                    ← Voltar ao Início
                </button>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg border border-yellow-100">
                <h2 className="text-2xl font-bold mb-4 text-gray-700">Teste de Geração de Áudio (Gemini TTS)</h2>
                
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Digite a frase para gerar o áudio..."
                    className="w-full p-3 border border-gray-300 rounded-lg mb-4 resize-y min-h-24 focus:ring-yellow-500 focus:border-yellow-500"
                />

                <button
                    onClick={handleGenerateAndPlay}
                    disabled={loading || !text}
                    className={`flex items-center justify-center px-6 py-3 rounded-lg font-bold text-lg transition-all duration-200 ${
                        loading ? 'bg-yellow-300 text-gray-700 cursor-not-allowed' : 'bg-[#F1C40F] text-gray-800 hover:bg-yellow-400 shadow-md'
                    }`}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Gerando Áudio...
                        </>
                    ) : (
                        <>
                            <Volume2 className="w-5 h-5 mr-2" />
                            Ouvir Frase (Voz IA)
                        </>
                    )}
                </button>

                {audioUrl && (
                    <p className="mt-4 text-green-600 font-semibold flex items-center">
                        <Zap className="w-4 h-4 mr-2" />
                        Áudio gerado com sucesso!
                    </p>
                )}

                {error && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        <strong>Erro:</strong> {error}
                    </div>
                )}
            </div>
            
            {/* Aqui você adicionaria a grade de níveis (A1, A2, etc.) */}

        </div>
    );
}

export default ListeningPage;
