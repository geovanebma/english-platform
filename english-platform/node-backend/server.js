import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const MAX_RETRIES = 3;
const DELAY_TIME = 2000;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("ERRO CRÍTICO: A chave GEMINI_API_KEY não foi encontrada. Verifique o arquivo .env.");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function gerarTexto(prompt) {
    console.log(`\n🤖 PROCESSANDO PROMPT: "${prompt}"`);

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    temperature: 0.7,
                }
            });

            const textoGerado = response.text;

            console.log("--- ✅ SUCESSO | Resposta da IA ---");
            console.log(textoGerado);
            console.log("----------------------------------\n");
            return;

        } catch (error) {
            const errorMessage = error.message;
            const isOverloadedError = errorMessage.includes("503") || errorMessage.includes("UNAVAILABLE");

            if (isOverloadedError && i < MAX_RETRIES - 1) {
                const currentWaitTime = DELAY_TIME * (i + 1);

                console.log(`⚠️ Erro temporário (503/Sobrecarga). Tentativa ${i + 1}/${MAX_RETRIES}.`);
                console.log(`   Reexecutando em ${currentWaitTime / 1000} segundos...`);

                await delay(currentWaitTime);

            } else {
                console.error(`❌ ERRO FATAL: Falha ao gerar texto após ${i + 1} tentativas.`);
                console.error("   Detalhes do erro:", errorMessage);
                break;
            }
        }
    }
}

async function main() {
    console.log("Iniciando o gerador de texto com IA...");

    await gerarTexto("Crie um insert into assim: INSERT INTO listening_lessons VALUES ('A1', title 'Greetings', text 'um texto envolvendo o título gramatical informado no title', translation 'tradução do texto em português', difficulty '1 a 5', type 'DIALOGUE, DICTATION...')");

    console.log("\nExecução de todos os prompts finalizada.");
}

main();