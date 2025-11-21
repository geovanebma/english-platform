import React, { useState } from 'react';
import { Volume2, Loader2, Zap } from 'lucide-react';

// Variáveis Globais: Manter apiKey vazia, o ambiente de execução irá injetar se necessário.
const apiKey = "AIzaSyDTfuMCi5WlpKcDOAz1NoUwAytj1vs4gW4"; 
// A URL base da API
const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent";

// --- DADOS DE LIÇÃO E TESTE ESTÁTICOS ---
// Usando uma estrutura simples que você buscou do PostgreSQL (main_text e translation_pt)
const staticLesson = {
    title: "Teste de Voz Simples",
    main_text: "The sun is shining and I am learning English through technology.",
    translation_pt: "O sol está brilhando e estou aprendendo Inglês através da tecnologia."
};
// ----------------------------------------

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
// O erro 403 pode ser devido ao uso de "gemini-2.5-flash-preview-tts" em alguns ambientes.
// Vamos tentar usar a voz padrão 'Zephyr' e garantir o uso correto da URL.
const generateAudio = async (text, voiceName) => {
    // O ambiente de execução Canvas/Immersive é responsável por injetar a chave se a URL tiver 'key='
    const apiUrl = `${API_BASE_URL}?key=${apiKey}`;

    const payload = {
        contents: [{
            parts: [{ text: text }]
        }],
        generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceName || "Zephyr" } // Usando 'Zephyr'
                }
            }
        },
        model: "gemini-2.5-flash-preview-tts"
    };

    let response;
    // Implementação de Backoff Exponencial
    for (let i = 0; i < 3; i++) {
        try {
            response = await fetch(apiUrl, { 
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
                    const sampleRateMatch = mimeType.match(/rate=(\d+)/);
                    const sampleRate = sampleRateMatch ? parseInt(sampleRateMatch[1], 10) : 16000; 
                    const pcmData = base64ToArrayBuffer(audioData);
                    const pcm16 = new Int16Array(pcmData);
                    const wavBlob = pcmToWav(pcm16, sampleRate);
                    return URL.createObjectURL(wavBlob);
                }
                // Se a API retornar OK, mas sem áudio (pode ser problema na requisição)
                const errorBody = JSON.stringify(result, null, 2);
                console.error("API returned OK but no audio part:", errorBody);
                throw new Error("API OK, mas falha ao extrair áudio. Verifique a resposta da API.");
            } else if (response.status === 429) {
                console.warn(`Rate limit exceeded. Retrying in ${2 ** i}s...`);
                await new Promise(resolve => setTimeout(resolve, (2 ** i) * 1000));
            } else {
                // Lança um erro para o bloco catch
                const errorBody = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorBody}`);
            }
        } catch (error) {
            console.error('Fetch error during attempt:', i + 1, error);
            if (i === 2) throw error; 
            await new Promise(resolve => setTimeout(resolve, (2 ** i) * 1000));
        }
    }
    return null;
};


// Componente principal
function ListeningPage({ setCurrentView }) {
    const [audioUrl, setAudioUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Função para lidar com a geração e reprodução
    const handleGenerateAndPlay = async (textToSpeak) => {
        if (!textToSpeak) return;

        setLoading(true);
        setAudioUrl(null);
        setError(null); // Limpa erros anteriores

        try {
            // Usa a voz 'Zephyr' para um tom brilhante e amigável
            const url = await generateAudio(textToSpeak, 'Zephyr'); 
            if (url) {
                setAudioUrl(url);
                const audio = new Audio(url);
                audio.play();
            } else {
                setError('Erro ao gerar áudio. Verifique o console para detalhes.');
            }
        } catch (err) {
            console.error("Failed to generate audio:", err);
            setError(`Falha crítica ao conectar com a API de áudio: ${err.message}.`);
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
                <h2 className="text-2xl font-bold mb-4 text-gray-700">Lição de Teste: {staticLesson.title}</h2>
                
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Frase em Inglês:</h3>
                    <p className="text-lg text-gray-600 italic">"{staticLesson.main_text}"</p>
                    
                    <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">Tradução (Português):</h3>
                    <p className="text-lg text-gray-600">"{staticLesson.translation_pt}"</p>
                </div>

                <button
                    onClick={() => handleGenerateAndPlay(staticLesson.main_text)}
                    disabled={loading}
                    className={`flex items-center justify-center px-6 py-3 rounded-lg font-bold text-lg w-full transition-all duration-200 ${
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
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg font-semibold flex items-center justify-center">
                        <Zap className="w-4 h-4 mr-2" />
                        Áudio pronto! Reproduzindo automaticamente...
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        <strong>Erro de API:</strong> {error}
                        <p className='text-sm mt-1'>O erro 403 é comum em ambientes restritos. A função foi revisada para lidar com a injeção da chave, mas pode exigir uma nova execução no ambiente.</p>
                    </div>
                )}
            </div>
            
            {/* O próximo passo será carregar dinamicamente a lista de lições do PostgreSQL aqui. */}

        </div>
    );
}

export default ListeningPage;
