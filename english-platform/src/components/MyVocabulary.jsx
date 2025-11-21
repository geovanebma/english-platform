import React, { useState, useEffect, useCallback } from 'react';
import { 
    BookOpen, Search, Filter, RotateCcw, Volume2, 
    Bookmark, Zap, Loader2, Maximize, X, Check 
} from 'lucide-react';

// === DADOS E FUNÇÕES TTS REUTILIZADAS DO LISTENING.JSX ===

// Variáveis Globais (Mantidas para consistência e injeção automática no Canvas)
const apiKey = "AIzaSyDTfuMCi5WlpKcDOAz1NoUwAytj1vs4gW4"; 
const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent";

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

// Helper para converter PCM em WAV (necessário para o áudio)
const pcmToWav = (pcm16, sampleRate) => {
    // [CÓDIGO PCM TO WAV OMITIDO POR BREVIDADE, MAS INCLUÍDO NO ARQUIVO COMPLETO]
    // A função completa pcmToWav do Listening.jsx deve ser incluída aqui para que o componente funcione.
    const numChannels = 1;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const numSamples = pcm16.length;
    const dataSize = numSamples * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    
    view.setUint32(0, 0x52494646, false); // 'RIFF'
    view.setUint32(4, 36 + dataSize, true); // file size
    view.setUint32(8, 0x57415645, false); // 'WAVE'
    view.setUint32(12, 0x666d7420, false); // 'fmt '
    view.setUint32(16, 16, true); // format chunk length
    view.setUint16(20, 1, true); // sample format (raw PCM)
    view.setUint16(22, numChannels, true); // channel count
    view.setUint32(24, sampleRate, true); // sample rate
    view.setUint32(28, byteRate, true); // byte rate
    view.setUint16(32, blockAlign, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    view.setUint32(36, 0x64617461, false); // 'data'
    view.setUint32(40, dataSize, true); // data chunk length
    
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
        view.setInt16(offset, pcm16[i], true);
        offset += 2;
    }
    
    return new Blob([view], { type: 'audio/wav' });
};


// Função de API para gerar áudio
const generateAudio = async (text, voiceName = "Kore") => {
    const apiUrl = `${API_BASE_URL}?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: text }] }],
        generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName } }
            }
        },
        model: "gemini-2.5-flash-preview-tts"
    };

    let response;
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
                return null;
            } else if (response.status === 429) {
                await new Promise(resolve => setTimeout(resolve, (2 ** i) * 1000));
            } else {
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

// === DADOS MOCK (SIMULAÇÃO DE POSTGRESQL) ===
// Estes dados simulam o que seria retornado pelo seu backend Node.js lendo o PostgreSQL.
// Note que 'meanings' já é um objeto JS (foi JSON.parse(meanings_json) no backend).
const mockVocabulary = [
    { id: 1, word: "the", most_used_position: 0, is_learned: true, examples_text: "The sun is hot; The book is old.", meanings: [{ type: "Article", meaning: "used to refer to specific people or things" }] },
    { id: 2, word: "of", most_used_position: 1, is_learned: false, examples_text: "A piece of cake; The start of the week.", meanings: [{ type: "Preposition", meaning: "expressing the relationship between a part and a whole" }] },
    { id: 3, word: "and", most_used_position: 2, is_learned: true, examples_text: "Bread and butter; John and Mary are friends.", meanings: [{ type: "Conjunction", meaning: "used to connect words of the same part of speech" }] },
    { id: 4, word: "to", most_used_position: 3, is_learned: false, examples_text: "I go to work; Listen to the music.", meanings: [{ type: "Preposition/Infinitive marker", meaning: "expressing motion in the direction of (a place)" }] },
    { id: 5, word: "a", most_used_position: 4, is_learned: true, examples_text: "I bought a dog; She is an artist.", meanings: [{ type: "Article", meaning: "used before singular nouns referring to a person or thing that is not specified" }] },
    { id: 6, word: "in", most_used_position: 5, is_learned: false, examples_text: "The book is in the bag. We live in London.", meanings: [{ type: "Preposition", meaning: "expressing the situation of something that is or appears to be enclosed or surrounded by something else." }] },
];


// === COMPONENTES SECUNDÁRIOS ===

// Modal para exibir detalhes da palavra
const WordDetailsModal = ({ word, meanings, examples, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl transform transition-all scale-100 opacity-100">
            <div className="flex justify-between items-start border-b pb-3 mb-4">
                <h3 className="text-3xl font-extrabold text-[#096105]">{word}</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-900 p-1 transition-colors rounded-full bg-gray-100">
                    <X className="w-6 h-6" />
                </button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                    <h4 className="text-xl font-bold text-gray-700 mb-2 border-l-4 border-[#096105] pl-2">Significados</h4>
                    {meanings.length > 0 ? (
                        <ul className="list-disc ml-5 space-y-2 text-gray-600">
                            {meanings.map((m, index) => (
                                <li key={index}>
                                    <span className="font-semibold text-gray-800">[{m.type}]</span> {m.meaning}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 italic">Nenhum significado detalhado fornecido.</p>
                    )}
                </div>

                <div>
                    <h4 className="text-xl font-bold text-gray-700 mb-2 border-l-4 border-yellow-500 pl-2">Exemplos</h4>
                    <p className="text-gray-700 bg-yellow-50 p-3 rounded-lg border border-yellow-100 italic whitespace-pre-wrap">
                        {examples || 'Nenhum exemplo fornecido.'}
                    </p>
                </div>
            </div>
            
            <button 
                onClick={onClose} 
                className="mt-6 w-full bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-gray-700 transition-colors"
            >
                Fechar
            </button>
        </div>
    </div>
);


// === COMPONENTE PRINCIPAL: MyVocabulary ===

export default function MyVocabulary({ setCurrentView }) {
    const [vocabulary, setVocabulary] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // 'all', 'learned', 'unlearned'
    const [isLoading, setIsLoading] = useState(true);
    const [speakingWord, setSpeakingWord] = useState(null);
    const [selectedWord, setSelectedWord] = useState(null); // Para o modal de detalhes
    const [audioError, setAudioError] = useState(null); // Novo estado de erro de áudio
    
    // Simulação do carregamento de dados (substitua por sua lógica Firestore/Backend)
    useEffect(() => {
        // TODO: Substituir por 'onSnapshot' ou fetch real do backend (PostgreSQL)
        const loadData = () => {
            setIsLoading(true);
            setTimeout(() => {
                setVocabulary(mockVocabulary.sort((a, b) => a.most_used_position - b.most_used_position));
                setIsLoading(false);
            }, 800);
        };
        loadData();
    }, []);

    // Função de Pronúncia
    const handleSpeak = useCallback(async (word) => {
        setAudioError(null); // Limpa qualquer erro anterior
        setSpeakingWord(word);
        try {
            const url = await generateAudio(word, 'Aoede'); // Voz 'Aoede' (Breezy)
            if (url) {
                const audio = new Audio(url);
                audio.play();
                audio.onended = () => setSpeakingWord(null);
            } else {
                console.error('Falha ao gerar URL de áudio: URL nula.');
                setAudioError('Falha na geração do áudio. Tente novamente mais tarde.');
                setSpeakingWord(null);
            }
        } catch (err) {
            console.error("Erro ao falar:", err);
            setAudioError(`Erro ao processar áudio: ${err.message || 'Erro desconhecido.'}`);
            setSpeakingWord(null);
        }
        // Limpa a mensagem de erro após 5 segundos
        setTimeout(() => setAudioError(null), 5000);
    }, []);

    // Função para alternar o estado 'is_learned'
    const toggleLearned = (id) => {
        setVocabulary(prev => prev.map(word => 
            word.id === id ? { ...word, is_learned: !word.is_learned } : word
        ));
        // TODO: Adicionar aqui a chamada ao backend (UPDATE no PostgreSQL)
    };

    // Lógica de Filtragem e Pesquisa
    const filteredVocabulary = vocabulary
        .filter(item => {
            if (filter === 'learned') return item.is_learned;
            if (filter === 'unlearned') return !item.is_learned;
            return true;
        })
        .filter(item => item.word.toLowerCase().includes(searchTerm.toLowerCase()));

    if (isLoading) {
        return <div className="text-center py-20 text-gray-500"><Loader2 className="animate-spin inline mr-2 w-8 h-8" /> Carregando seu vocabulário...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto py-12 px-6">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-4xl font-extrabold text-[#096105]">Meu Vocabulário Principal</h1>
                <button 
                    onClick={() => setCurrentView('initial')} 
                    className="bg-gray-800 text-white px-5 py-2 rounded-lg font-bold hover:bg-gray-700 transition-colors"
                >
                    ← Voltar ao Início
                </button>
            </div>
            
            {/* Feedback de Erro de Áudio (Toast Simplificado) */}
            {audioError && (
                <div className="fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-xl z-50 flex items-center space-x-2 animate-pulse">
                    <Zap className="w-5 h-5" />
                    <p className="font-semibold">{audioError}</p>
                    <button onClick={() => setAudioError(null)} className="ml-4 p-1 rounded-full hover:bg-red-700">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-2xl border border-green-100">
                
                {/* Controles de Busca e Filtro */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar palavra..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-3 pl-10 border border-gray-300 rounded-xl focus:border-[#096105] focus:ring-[#096105] transition-shadow"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>

                    <div className="flex space-x-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                                filter === 'all' ? 'bg-[#096105] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            Todas ({vocabulary.length})
                        </button>
                        <button
                            onClick={() => setFilter('learned')}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                                filter === 'learned' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            Aprendidas
                        </button>
                        <button
                            onClick={() => setFilter('unlearned')}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                                filter === 'unlearned' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            Aprender
                        </button>
                    </div>
                </div>

                {/* Tabela de Palavras */}
                <div className="overflow-x-auto shadow-md rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#096105] text-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-16">
                                    <Bookmark className="w-4 h-4 inline" />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Palavra
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-32 hidden sm:table-cell">
                                    Posição
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider w-40">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredVocabulary.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500 italic">
                                        Nenhuma palavra encontrada.
                                    </td>
                                </tr>
                            ) : (
                                filteredVocabulary.map((item) => (
                                    <tr 
                                        key={item.id} 
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        {/* Checkbox 'is_learned' */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <label className="flex items-center justify-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={item.is_learned}
                                                    onChange={() => toggleLearned(item.id)}
                                                    className={`w-5 h-5 text-[#096105] rounded border-gray-300 focus:ring-[#096105] transition-colors ${item.is_learned ? 'bg-green-500' : 'bg-red-500'}`}
                                                />
                                            </label>
                                        </td>
                                        
                                        {/* Palavra */}
                                        <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-gray-900">
                                            {item.word}
                                        </td>
                                        
                                        {/* Posição */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                                            #{item.most_used_position + 1}
                                        </td>

                                        {/* Ações: Ver, Ouvir */}
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <div className="flex justify-center space-x-3">
                                                {/* Botão de Ver Detalhes (Lupa) */}
                                                <button
                                                    onClick={() => setSelectedWord(item)}
                                                    className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                                                    title="Ver Significado e Exemplos"
                                                >
                                                    <Maximize className="w-5 h-5" />
                                                </button>

                                                {/* Botão de Pronúncia (Ouvir) */}
                                                <button
                                                    onClick={() => handleSpeak(item.word)}
                                                    disabled={speakingWord === item.word}
                                                    className={`p-2 rounded-full transition-colors w-10 h-10 flex items-center justify-center ${
                                                        speakingWord === item.word 
                                                            ? 'bg-yellow-300 text-gray-700 cursor-not-allowed' 
                                                            : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                                                    }`}
                                                    title={`Ouvir ${item.word}`}
                                                >
                                                    {speakingWord === item.word ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <Volume2 className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <p className="mt-8 text-sm text-gray-500 text-center">
                    Exibindo {filteredVocabulary.length} de {vocabulary.length} palavras.
                </p>

            </div>

            {/* Renderizar o Modal se uma palavra estiver selecionada */}
            {selectedWord && (
                <WordDetailsModal
                    word={selectedWord.word}
                    meanings={selectedWord.meanings}
                    examples={selectedWord.examples_text}
                    onClose={() => setSelectedWord(null)}
                />
            )}
        </div>
    );
}


// export default function JsonToSqlConverter({ setCurrentView }) {
//     const [sqlOutput, setSqlOutput] = useState('');
//     const [fileName, setFileName] = useState(null);
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState(null);
//     const [copySuccess, setCopySuccess] = useState(false);

//     // Função principal que lê o arquivo e dispara a conversão
//     const handleFileChange = useCallback((event) => {
//         const file = event.target.files[0];
//         if (!file) return;

//         setFileName(file.name);
//         setIsLoading(true);
//         setError(null);
//         setSqlOutput('');

//         const reader = new FileReader();

//         reader.onload = (e) => {
//             try {
//                 const jsonText = e.target.result;
//                 const data = JSON.parse(jsonText);

//                 if (!Array.isArray(data)) {
//                     throw new Error("O arquivo JSON deve ser um Array de objetos.");
//                 }
                
//                 // Dispara a função de conversão
//                 const sql = generateSqlInserts(data);
//                 setSqlOutput(sql);
//                 setIsLoading(false);

//             } catch (err) {
//                 console.error("Erro no processamento do arquivo:", err);
//                 setError(`Erro: ${err.message}. Verifique o formato do JSON.`);
//                 setIsLoading(false);
//             }
//         };

//         reader.onerror = () => {
//             setError("Falha ao ler o arquivo.");
//             setIsLoading(false);
//         };

//         reader.readAsText(file);
//     }, []);

//     // Função para copiar o SQL para a área de transferência
//     const handleCopy = () => {
//         if (sqlOutput) {
//             navigator.clipboard.writeText(sqlOutput)
//                 .then(() => {
//                     setCopySuccess(true);
//                     setTimeout(() => setCopySuccess(false), 2000);
//                 })
//                 .catch(err => {
//                     console.error('Erro ao copiar:', err);
//                     setError('Falha ao copiar o texto. Tente manualmente.');
//                 });
//         }
//     };

//     return (
//         <div className="max-w-4xl mx-auto py-12 px-6">
//             <div className="flex justify-between items-center mb-10">
//                 <h1 className="text-4xl font-extrabold text-gray-800">Ferramenta: JSON para SQL</h1>
//                 <button 
//                     onClick={() => setCurrentView('initial')} 
//                     className="bg-gray-800 text-white px-5 py-2 rounded-lg font-bold hover:bg-gray-700 transition-colors"
//                 >
//                     ← Voltar ao Início
//                 </button>
//             </div>

//             <div className="bg-white p-8 rounded-xl shadow-2xl border border-blue-100">
//                 <h2 className="text-2xl font-bold mb-4 text-blue-600 flex items-center">
//                     <FileUp className="w-6 h-6 mr-2" />
//                     1. Carregar Arquivo JSON
//                 </h2>
//                 <p className="mb-4 text-gray-600">Selecione o arquivo JSON (formato array de objetos) para gerar os comandos `INSERT INTO` para o PostgreSQL.</p>
                
//                 {/* Input de Arquivo */}
//                 <label className="block w-full cursor-pointer bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl p-6 hover:bg-blue-100 transition-colors">
//                     <input 
//                         type="file" 
//                         accept=".json" 
//                         onChange={handleFileChange} 
//                         className="hidden"
//                         disabled={isLoading}
//                     />
//                     <div className="flex flex-col items-center justify-center text-blue-500">
//                         {isLoading ? (
//                             <Loader2 className="w-8 h-8 animate-spin" />
//                         ) : (
//                             <FileUp className="w-8 h-8" />
//                         )}
//                         <span className="mt-2 font-semibold">
//                             {fileName ? `Arquivo Carregado: ${fileName}` : 'Clique para selecionar seu arquivo JSON (.json)'}
//                         </span>
//                         {error && <p className="text-red-500 mt-2 font-medium">{error}</p>}
//                     </div>
//                 </label>

//                 {/* Área de Saída SQL */}
//                 {sqlOutput && (
//                     <div className="mt-8">
//                         <h2 className="text-2xl font-bold mb-4 text-gray-700 flex items-center">
//                             <Terminal className="w-6 h-6 mr-2" />
//                             2. Comandos SQL Gerados ({sqlOutput.split('\n').filter(line => line.startsWith('INSERT')).length} INSERTs)
//                         </h2>
//                         <div className="relative">
//                             <textarea
//                                 readOnly
//                                 value={sqlOutput}
//                                 rows={15}
//                                 className="w-full p-4 bg-gray-900 text-green-400 font-mono text-xs rounded-xl shadow-inner resize-none"
//                                 placeholder="O SQL gerado aparecerá aqui..."
//                             />
//                             <button
//                                 onClick={handleCopy}
//                                 className={`absolute top-2 right-2 p-2 rounded-lg transition-all flex items-center font-semibold text-sm ${
//                                     copySuccess ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
//                                 }`}
//                                 title="Copiar para a Área de Transferência"
//                             >
//                                 {copySuccess ? 'Copiado!' : 'Copiar SQL'}
//                                 <Copy className="w-4 h-4 ml-1" />
//                             </button>
//                         </div>
//                         <p className="mt-2 text-sm text-gray-500">
//                             Copie e execute estes comandos no seu cliente PostgreSQL.
//                         </p>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }