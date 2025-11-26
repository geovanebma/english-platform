// import 'dotenv/config';
// import { GoogleGenAI } from '@google/genai';

// const MAX_RETRIES = 3;
// const DELAY_TIME = 2000;
// const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
// const apiKey = process.env.GEMINI_API_KEY;

// if (!apiKey) {
//     console.error("ERRO CRÍTICO: A chave GEMINI_API_KEY não foi encontrada. Verifique o arquivo .env.");
//     process.exit(1);
// }

// const ai = new GoogleGenAI({ apiKey });

// async function gerarTexto(prompt) {
//     console.log(`\n🤖 PROCESSANDO PROMPT: "${prompt}"`);

//     for (let i = 0; i < MAX_RETRIES; i++) {
//         try {
//             const response = await ai.models.generateContent({
//                 model: "gemini-2.5-flash",
//                 contents: [{ role: "user", parts: [{ text: prompt }] }],
//                 config: {
//                     temperature: 0.7,
//                 }
//             });

//             const textoGerado = response.text;

//             console.log("--- ✅ SUCESSO | Resposta da IA ---");
//             console.log(textoGerado);
//             console.log("----------------------------------\n");
//             return;

//         } catch (error) {
//             const errorMessage = error.message;
//             const isOverloadedError = errorMessage.includes("503") || errorMessage.includes("UNAVAILABLE");

//             if (isOverloadedError && i < MAX_RETRIES - 1) {
//                 const currentWaitTime = DELAY_TIME * (i + 1);

//                 console.log(`⚠️ Erro temporário (503/Sobrecarga). Tentativa ${i + 1}/${MAX_RETRIES}.`);
//                 console.log(`   Reexecutando em ${currentWaitTime / 1000} segundos...`);

//                 await delay(currentWaitTime);

//             } else {
//                 console.error(`❌ ERRO FATAL: Falha ao gerar texto após ${i + 1} tentativas.`);
//                 console.error("   Detalhes do erro:", errorMessage);
//                 break;
//             }
//         }
//     }
// }

// async function main() {
//     console.log("Iniciando o gerador de texto com IA...");

//     await gerarTexto("Crie um insert into assim: INSERT INTO listening_lessons VALUES ('A1', title 'Greetings', text 'um texto envolvendo o título gramatical informado no title', translation 'tradução do texto em português', difficulty '1 a 5', type 'DIALOGUE, DICTATION...')");

//     console.log("\nExecução de todos os prompts finalizada.");
// }

// main();

import 'dotenv/config';
import express from 'express';
import { GoogleGenAI } from '@google/genai';

// --- Configuração de Retentativa ---
const MAX_RETRIES = 3;
const DELAY_TIME = 2000;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
// -----------------------------------

const apiKey = process.env.GEMINI_API_KEY;

// Instrução do Sistema para definir o papel da IA (Tutor de Inglês)
const SYSTEM_INSTRUCTION = "Você é um parceiro de conversação em inglês chamado 'TutorAI'. Seu objetivo é ajudar o usuário a praticar inglês. Responda de forma natural em inglês, mantendo a conversa fluindo. Se o usuário cometer um erro gramatical ou de vocabulário, forneça a correção sutilmente na sua resposta e, no final, adicione uma seção separada em português (iniciando com '✨ Correção:') explicando o erro e a correção de forma amigável e encorajadora.";

if (!apiKey) {
    console.error("ERRO CRÍTICO: A chave GEMINI_API_KEY não foi encontrada. Verifique o arquivo .env.");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para permitir JSON no corpo da requisição
app.use(express.json());

// Middleware CORS básico para permitir que o frontend React se conecte (ajustar para produção)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Permite qualquer origem
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

/**
 * Endpoint para processar a conversa com a IA.
 * Recebe o histórico completo (contents) e envia para o modelo Gemini.
 * Rota: POST /api/chat
 * Corpo: { contents: Array<Part> }
 */
app.post('/api/chat', async (req, res) => {
    const { contents } = req.body;

    if (!contents || !Array.isArray(contents)) {
        return res.status(400).json({ error: "O corpo da requisição deve conter 'contents' como um array de mensagens (histórico do chat)." });
    }

    console.log(`\n🤖 PROCESSANDO CHAT COM ${contents.length} MENSAGENS...`);

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                // Passa o histórico completo do chat
                contents: contents, 
                config: {
                    temperature: 0.8, // Mais criativo para conversação
                },
                systemInstruction: {
                    parts: [{ text: SYSTEM_INSTRUCTION }]
                }
            });

            const textoGerado = response.text;
            console.log("--- ✅ SUCESSO | Resposta da IA no Chat ---\n", textoGerado);

            // Retorna a resposta da IA para o frontend
            return res.json({ responseText: textoGerado });

        } catch (error) {
            const errorMessage = error.message;
            const isOverloadedError = errorMessage.includes("503") || errorMessage.includes("UNAVAILABLE");

            if (isOverloadedError && i < MAX_RETRIES - 1) {
                const currentWaitTime = DELAY_TIME * (i + 1);
                console.log(`⚠️ Erro temporário (503/Sobrecarga). Tentativa ${i + 1}/${MAX_RETRIES}. Reexecutando em ${currentWaitTime / 1000}s...`);
                await delay(currentWaitTime);
            } else {
                console.error(`❌ ERRO FATAL: Falha ao gerar texto após ${i + 1} tentativas.`);
                console.error("   Detalhes do erro:", errorMessage);
                
                // Retorna um erro 500 para o frontend
                return res.status(500).json({ error: "Falha ao processar a mensagem no servidor.", details: errorMessage });
            }
        }
    }
    
    // Se sair do loop de retries sem sucesso
    return res.status(500).json({ error: "Falha ao processar a mensagem após várias tentativas." });
});

// Inicializa o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Endpoint de Chat: http://localhost:${PORT}/api/chat`);
});