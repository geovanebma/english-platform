import Constants from 'expo-constants';

const runtimeExtra = Constants.expoConfig?.extra || Constants.manifest2?.extra || {};
const API_URL = process.env.EXPO_PUBLIC_VOCAB_API_URL || runtimeExtra.publicVocabApiUrl || '';
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || runtimeExtra.publicGroqApiKey || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

function buildExampleText(parsed) {
  const exampleEn = String(parsed?.exampleEn || parsed?.example || '').trim();
  const examplePt = String(parsed?.examplePt || parsed?.exampleTranslation || '').trim();

  if (exampleEn && examplePt) {
    return 'EN: ' + exampleEn + '\nPT: ' + examplePt;
  }

  if (exampleEn) return 'EN: ' + exampleEn;
  if (examplePt) return 'PT: ' + examplePt;
  return '';
}

function sanitizeEntry(word, parsed) {
  const exampleText = buildExampleText(parsed);
  const exampleEn = String(parsed?.exampleEn || parsed?.example || '').trim();

  return {
    word,
    translation: String(parsed?.translation || '').trim(),
    meaning: String(parsed?.meaning || '').trim(),
    example: exampleText,
    listeningText: String(parsed?.listeningText || exampleEn || word).trim(),
  };
}

function extractJsonPayload(content) {
  const raw = String(content || '').trim();
  if (!raw) return {};

  const withoutFences = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    return JSON.parse(withoutFences);
  } catch {}

  const firstBrace = withoutFences.indexOf('{');
  const lastBrace = withoutFences.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const candidate = withoutFences.slice(firstBrace, lastBrace + 1);
    return JSON.parse(candidate);
  }

  throw new Error('Groq returned invalid JSON content');
}

async function lookupViaGroq(word) {
  if (!GROQ_API_KEY) {
    throw new Error('Missing EXPO_PUBLIC_GROQ_API_KEY');
  }

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content:
            'Return only valid JSON with keys: word, translation, meaning, exampleEn, examplePt, listeningText. Keep it concise and learner friendly for a Brazilian Portuguese speaker studying English vocabulary. The exampleEn must be a natural English sentence using the word. The examplePt must be the Portuguese translation of that exact sentence. The listeningText should normally match exampleEn. Vary the sentence pattern and the role of the target word. Do not overuse simple direct-object noun sentences or generic templates like placing a noun as an object or saying it is in some place. Prefer diverse, natural sentence structures such as the word as subject, complement, question focus, time expression, contrast, action, or clause anchor whenever appropriate.',
        },
        {
          role: 'user',
          content: `Create a dictionary entry for the English word: ${word}. Respond with JSON only. Make the example sentence natural and varied. Avoid using the target word only as a generic object when another natural structure is possible.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Groq lookup failed with ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || '{}';
  const parsed = extractJsonPayload(content);
  return sanitizeEntry(word, parsed);
}

async function lookupViaProxy(word) {
  if (!API_URL) return null;
  const response = await fetch(`${API_URL}/api/dictionary/lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Dictionary lookup failed with ${response.status}: ${errorText}`);
  }

  const parsed = await response.json();
  return sanitizeEntry(word, parsed);
}

export async function lookupDictionaryEntry(word) {
  const cleanWord = String(word || '').trim().toLowerCase();
  if (!cleanWord) return null;

  try {
    if (GROQ_API_KEY) {
      return await lookupViaGroq(cleanWord);
    }
  } catch (error) {
    console.warn('[apiClient] Direct Groq lookup failed:', error?.message || error);
  }

  return lookupViaProxy(cleanWord);
}
