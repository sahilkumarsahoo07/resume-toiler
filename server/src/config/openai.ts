import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openAIKey = process.env.OPENAI_API_KEY;
const geminiKey = process.env.GEMINI_API_KEY;
const openRouterKey = process.env.OPENROUTER_API_KEY;

export let openaiClient: OpenAI | null = null;
export let geminiClient: OpenAI | null = null;
export let openRouterClient: OpenAI | null = null;
export let aiModel = 'gpt-4o-mini';

const isGeminiKey = (key: string | undefined): boolean => {
  if (!key) return false;
  const trimmed = key.trim();
  return trimmed.startsWith('AIza') || trimmed.startsWith('AQ.');
};

// 1. Initialize OpenRouter
if (openRouterKey) {
  openRouterClient = new OpenAI({
    apiKey: openRouterKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'http://localhost:5000',
      'X-Title': 'Resume Refinement',
    }
  });
  console.log('OpenRouter client initialized.');
}

// 2. Initialize Gemini client
if (geminiKey) {
  geminiClient = new OpenAI({
    apiKey: geminiKey,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
  });
  console.log('Google Gemini client initialized.');
} else if (openAIKey && isGeminiKey(openAIKey)) {
  geminiClient = new OpenAI({
    apiKey: openAIKey,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
  });
  console.log('Google Gemini client initialized via OPENAI_API_KEY.');
}

// 3. Initialize OpenAI client
if (openAIKey && !isGeminiKey(openAIKey)) {
  openaiClient = new OpenAI({ apiKey: openAIKey });
  console.log('OpenAI client initialized.');
}

// Set default fallback model and print active configuration
if (openRouterClient) {
  aiModel = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b:free';
  console.log(`Default API provider: OpenRouter (${aiModel})`);
} else if (geminiClient) {
  aiModel = 'gemini-2.5-flash';
  console.log(`Default API provider: Google Gemini (${aiModel})`);
} else if (openaiClient) {
  aiModel = 'gpt-4o-mini';
  console.log(`Default API provider: OpenAI (${aiModel})`);
} else {
  console.warn('WARNING: No API keys configured. The server will run in MOCK mode.');
}

// Check if we have at least one client
export const isMockMode = !openRouterClient && !geminiClient && !openaiClient;

/**
 * Resolves the correct OpenAI client instance and model name based on the requested model ID
 */
export function getAIClient(reqModelId?: string): { client: OpenAI | null; model: string } {
  const selectedModel = reqModelId || aiModel;

  // 1. If it's a native OpenAI model
  if (selectedModel === 'gpt-4o-mini') {
    if (openaiClient) return { client: openaiClient, model: 'gpt-4o-mini' };
    if (openRouterClient) return { client: openRouterClient, model: 'openai/gpt-4o-mini' };
  }

  // 2. If it's a native Gemini model
  if (selectedModel === 'gemini-2.5-flash') {
    if (geminiClient) return { client: geminiClient, model: 'gemini-2.5-flash' };
    if (openRouterClient) return { client: openRouterClient, model: 'google/gemini-2.5-flash' };
  }

  // 3. If it's an OpenRouter model
  if (selectedModel.includes('/') || selectedModel.includes(':')) {
    if (openRouterClient) return { client: openRouterClient, model: selectedModel };
  }

  // 4. Default fallbacks
  if (openRouterClient) return { client: openRouterClient, model: selectedModel };
  if (geminiClient) return { client: geminiClient, model: 'gemini-2.5-flash' };
  if (openaiClient) return { client: openaiClient, model: 'gpt-4o-mini' };

  return { client: null, model: selectedModel };
}
