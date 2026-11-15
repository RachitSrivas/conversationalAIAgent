import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export function getLanguageModel() {
  const provider = process.env.MODEL_PROVIDER?.toLowerCase();
  const modelName = process.env.MODEL_NAME;

  // 1. OpenAI
  const openaiKey = process.env.OPENAI_API_KEY;
  if ((provider === 'openai' || !provider) && openaiKey && !openaiKey.includes('your_')) {
    const openai = createOpenAI({ apiKey: openaiKey });
    return openai(modelName || 'gpt-4o-mini');
  }

  // 2. Anthropic
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if ((provider === 'anthropic' || anthropicKey) && anthropicKey && !anthropicKey.includes('your_')) {
    const anthropic = createAnthropic({ apiKey: anthropicKey });
    return anthropic(modelName || 'claude-3-5-sonnet-latest');
  }

  // 3. Google Gemini
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if ((provider === 'google' || geminiKey) && geminiKey && !geminiKey.includes('your_')) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    return google(modelName || 'gemini-2.0-flash');
  }

  // Default fallback to OpenAI client (will throw readable error if key not set upon request)
  const openai = createOpenAI({ apiKey: openaiKey || 'missing-key' });
  return openai('gpt-4o-mini');
}
