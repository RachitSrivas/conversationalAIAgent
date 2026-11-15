import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export function getLanguageModel() {
  const provider = process.env.MODEL_PROVIDER?.toLowerCase();
  const modelName = process.env.MODEL_NAME;

  // 1. If explicitly set to Google or if GEMINI_API_KEY is present and OPENAI is not explicitly chosen
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if ((provider === 'google' || (!provider && geminiKey)) && geminiKey && !geminiKey.includes('your_')) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    return google(modelName || 'gemini-3.5-flash');
  }

  // 2. OpenAI
  const openaiKey = process.env.OPENAI_API_KEY;
  if ((provider === 'openai' || !provider) && openaiKey && !openaiKey.includes('your_')) {
    const openai = createOpenAI({ apiKey: openaiKey });
    return openai(modelName || 'gpt-4o-mini');
  }

  // 3. Anthropic
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if ((provider === 'anthropic' || anthropicKey) && anthropicKey && !anthropicKey.includes('your_')) {
    const anthropic = createAnthropic({ apiKey: anthropicKey });
    return anthropic(modelName || 'claude-3-5-sonnet-latest');
  }

  // Fallback
  if (geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    return google('gemini-3.5-flash');
  }

  const openai = createOpenAI({ apiKey: openaiKey || 'missing-key' });
  return openai('gpt-4o-mini');
}
