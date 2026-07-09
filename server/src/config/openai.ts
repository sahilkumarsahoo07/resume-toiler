import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openAIKey = process.env.OPENAI_API_KEY;
const geminiKey = process.env.GEMINI_API_KEY;
const openRouterKey = process.env.OPENROUTER_API_KEY;

export let openai: OpenAI | null = null;
export let aiModel = 'gpt-4o-mini';

const isGeminiKey = (key: string | undefined): boolean => {
  if (!key) return false;
  const trimmed = key.trim();
  return trimmed.startsWith('AIza') || trimmed.startsWith('AQ.');
};

if (openRouterKey) {
  openai = new OpenAI({
    apiKey: openRouterKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'http://localhost:5000', // Update with your actual production URL when deployed
      'X-Title': 'Resume Refinement',
    }
  });
  aiModel = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b:free';
  console.log(`API provider configured: OpenRouter (${aiModel})`);
} else if (geminiKey) {
  openai = new OpenAI({
    apiKey: geminiKey,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
  });
  aiModel = 'gemini-2.5-flash';
  console.log('API provider configured: Google Gemini (gemini-2.5-flash)');
} else if (openAIKey) {
  if (isGeminiKey(openAIKey)) {
    openai = new OpenAI({
      apiKey: openAIKey,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
    });
    aiModel = 'gemini-2.5-flash';
    console.log('API provider configured: Google Gemini via OPENAI_API_KEY (gemini-2.5-flash)');
  } else {
    openai = new OpenAI({ apiKey: openAIKey });
    aiModel = 'gpt-4o-mini';
    console.log('API provider configured: OpenAI (gpt-4o-mini)');
  }
} else {
  console.warn('WARNING: Neither OPENAI_API_KEY nor GEMINI_API_KEY are defined. The server will run in MOCK mode.');
}

export const isMockMode = !openai;
