import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectEnv = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: projectEnv });

const app = express();
app.use(cors());
app.use(express.json());

const port = Number(process.env.PERSONAL_VOCAB_PORT || 8787);
const apiKey = process.env.GROQ_API_KEY;
const client = apiKey ? new Groq({ apiKey }) : null;

app.get('/health', (_req, res) => {
  res.json({ ok: true, provider: client ? 'groq' : 'offline', env: projectEnv });
});

app.post('/api/dictionary/lookup', async (req, res) => {
  const word = String(req.body?.word || '').trim().toLowerCase();
  if (!word) {
    return res.status(400).json({ error: 'word is required' });
  }

  if (!client) {
    return res.json({
      word,
      translation: '',
      meaning: 'Proxy offline: configure GROQ_API_KEY in the local app .env to generate meanings.',
      example: `I am studying the word ${word} today.`,
      listeningText: `Today I want to remember the word ${word}.`,
    });
  }

  try {
    const completion = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Return only valid JSON with keys: word, translation, meaning, example, listeningText. Keep it concise and learner friendly for a Brazilian Portuguese speaker studying English vocabulary.'
        },
        {
          role: 'user',
          content: `Create a dictionary entry for the English word: ${word}`
        }
      ]
    });

    const content = completion.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    return res.json({
      word,
      translation: String(parsed.translation || '').trim(),
      meaning: String(parsed.meaning || '').trim(),
      example: String(parsed.example || '').trim(),
      listeningText: String(parsed.listeningText || parsed.example || word).trim(),
    });
  } catch (error) {
    return res.status(500).json({ error: 'lookup_failed', detail: error.message });
  }
});

app.listen(port, () => {
  console.log(`[personal-vocab-android] proxy listening on http://localhost:${port}`);
});
