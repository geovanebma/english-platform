// Carrega as variáveis de ambiente do arquivo .env
require('dotenv').config();

// Importa a classe principal do Google GenAI
const { GoogleGenAI } = require('@google/genai');

// Obtém a chave de API do arquivo .env
const apiKey = process.env.GEMINI_API_KEY;

// Verifica se a chave de API foi carregada
if (!apiKey) {
    console.error("ERRO: A chave GEMINI_API_KEY não foi encontrada. Verifique o arquivo .env.");
    process.exit(1);
}

// Inicializa o cliente da IA
const ai = new GoogleGenAI({ apiKey });

/**
 * Função assíncrona para gerar texto usando o modelo Gemini.
 * @param {string} prompt O texto de entrada para a IA.
 */
async function gerarTexto(prompt) {
    console.log(`\n🤖 Processando prompt: "${prompt}"`);

    try {
        // Envia a requisição para o modelo
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", // Modelo rápido e eficiente para texto
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            // Você pode adicionar um generationConfig para ajustar a resposta
            config: {
                temperature: 0.7, // Controla a aleatoriedade (0.0 a 1.0). 
                                 // 0.7 é bom para criatividade.
            }
        });

        // O texto gerado está em response.text
        const textoGerado = response.text;

        console.log("--- Resposta da IA ---");
        console.log(textoGerado);
        console.log("----------------------\n");

    } catch (error) {
        console.error("Ocorreu um erro ao gerar o texto:", error.message);
    }
}

// --- Exemplo de Uso ---

// 1. Prompt para gerar uma frase criativa
gerarTexto("Crie uma frase curta e inspiradora sobre começar um projeto do zero.");

// 2. Prompt para gerar um texto mais longo/listagem
// Nota: A função é chamada assincronamente, pode ser executada em paralelo (depende do ambiente).
// Para garantir a ordem, você usaria 'await' nas chamadas.
// Para este exemplo simples, vamos apenas chamar.
setTimeout(() => {
    gerarTexto("Liste 3 ideias de temas para um blog de tecnologia.");
}, 3000); // Atrasamos um pouco para melhor visualização no terminal