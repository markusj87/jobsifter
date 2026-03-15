/**
 * AI service abstraction supporting Claude and OpenAI providers.
 * Handles provider configuration, prompt completion, and token tracking.
 */

import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import type { AIProvider } from '../../shared/types'
import { getSetting } from '../database/repositories/settings'

/** Token usage counts returned from a single AI completion. */
export interface TokenUsage {
  inputTokens: number
  outputTokens: number
}

interface AIProviderInterface {
  complete(prompt: string): Promise<{ text: string; usage: TokenUsage }>
}

class ClaudeProvider implements AIProviderInterface {
  private client: Anthropic
  private model: string

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey })
    this.model = model
  }

  async complete(prompt: string): Promise<{ text: string; usage: TokenUsage }> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    })
    const block = message.content[0]
    return {
      text: block.type === 'text' ? block.text : '',
      usage: {
        inputTokens: message.usage?.input_tokens || 0,
        outputTokens: message.usage?.output_tokens || 0
      }
    }
  }
}

class OpenAIProvider implements AIProviderInterface {
  private client: OpenAI
  private model: string

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey })
    this.model = model
  }

  async complete(prompt: string): Promise<{ text: string; usage: TokenUsage }> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      max_completion_tokens: 4096
    })
    return {
      text: response.choices[0]?.message?.content || '',
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0
      }
    }
  }
}

/**
 * Singleton AI service that manages provider configuration and prompt completion.
 * Tracks cumulative token usage across calls for cost reporting.
 */
class AIService {
  private provider: AIProviderInterface | null = null
  totalInputTokens = 0
  totalOutputTokens = 0

  /** Configure the active AI provider with credentials and optional model override. */
  configure(providerType: AIProvider, apiKey: string, model?: string): void {
    if (providerType === 'claude') {
      this.provider = new ClaudeProvider(apiKey, model || 'claude-sonnet-4-6-20250627')
    } else if (providerType === 'openai') {
      this.provider = new OpenAIProvider(apiKey, model || 'gpt-5.4')
    } else {
      this.provider = null
    }
  }

  /** Check whether an AI provider is currently configured and ready. */
  isConfigured(): boolean {
    return this.provider !== null
  }

  /** Reset cumulative token counters to zero. */
  resetTokens(): void {
    this.totalInputTokens = 0
    this.totalOutputTokens = 0
  }

  /** Send a prompt to the configured AI provider and return the response text. */
  async complete(prompt: string): Promise<string> {
    if (!this.provider) {
      throw new Error('AI provider not configured. Set an API key in Settings.')
    }
    const result = await this.provider.complete(prompt)
    this.totalInputTokens += result.usage.inputTokens
    this.totalOutputTokens += result.usage.outputTokens
    return result.text
  }
}

/** The shared AI service instance used throughout the application. */
export const aiService = new AIService()

/**
 * Ensure the AI service is configured, loading credentials from settings if needed.
 * Throws a user-friendly error if no provider is set up.
 */
export function ensureAI(): void {
  if (!aiService.isConfigured()) {
    const provider = getSetting('aiProvider') as AIProvider | null
    const apiKey = getSetting('apiKey')
    const model = getSetting('aiModel')
    if (provider && provider !== 'none' && apiKey) {
      aiService.configure(provider, apiKey, model || undefined)
    }
  }
  if (!aiService.isConfigured()) {
    throw new Error('AI provider not configured. Go to Settings and connect Claude or OpenAI first.')
  }
}

/** Pricing info for a single AI model. $ per million tokens. */
export interface ModelInfo {
  id: string
  name: string
  inputPricePerMTok: number
  outputPricePerMTok: number
}

/** Available Claude model options with pricing. */
export const CLAUDE_MODELS: ModelInfo[] = [
  { id: 'claude-sonnet-4-6-20250627', name: 'Claude Sonnet 4.6', inputPricePerMTok: 3, outputPricePerMTok: 15 },
  { id: 'claude-opus-4-6-20250627', name: 'Claude Opus 4.6 (most capable)', inputPricePerMTok: 5, outputPricePerMTok: 25 },
  { id: 'claude-sonnet-4-5-20250514', name: 'Claude Sonnet 4.5', inputPricePerMTok: 3, outputPricePerMTok: 15 },
  { id: 'claude-opus-4-5-20250514', name: 'Claude Opus 4.5', inputPricePerMTok: 5, outputPricePerMTok: 25 },
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', inputPricePerMTok: 3, outputPricePerMTok: 15 },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5 (fast, cheapest)', inputPricePerMTok: 1, outputPricePerMTok: 5 }
]

/** Available OpenAI model options with pricing. */
export const OPENAI_MODELS: ModelInfo[] = [
  { id: 'gpt-5.4', name: 'GPT-5.4 (latest)', inputPricePerMTok: 2.5, outputPricePerMTok: 15 },
  { id: 'gpt-5-mini', name: 'GPT-5 Mini (fast, cheap)', inputPricePerMTok: 0.125, outputPricePerMTok: 1 },
  { id: 'gpt-5.3', name: 'GPT-5.3', inputPricePerMTok: 1.75, outputPricePerMTok: 14 },
  { id: 'o3', name: 'o3 (reasoning)', inputPricePerMTok: 2, outputPricePerMTok: 8 },
  { id: 'o3-mini', name: 'o3 Mini (reasoning, cheap)', inputPricePerMTok: 0.55, outputPricePerMTok: 2.2 },
  { id: 'o4-mini', name: 'o4 Mini (reasoning)', inputPricePerMTok: 1.1, outputPricePerMTok: 4.4 },
  { id: 'gpt-4.1', name: 'GPT-4.1', inputPricePerMTok: 3, outputPricePerMTok: 12 },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', inputPricePerMTok: 0.8, outputPricePerMTok: 3.2 },
  { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano (cheapest)', inputPricePerMTok: 0.2, outputPricePerMTok: 0.8 }
]
