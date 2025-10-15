/**
 * AI Configuration for Souqify
 *
 * This file contains configuration options for different AI backends
 * and providers that can be used with the Souqify AI assistant.
 */

export interface AIProvider {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  apiKey?: string;
  models: string[];
  features: {
    chatCompletion: boolean;
    streaming: boolean;
    multimodal: boolean;
    functionCalling: boolean;
  };
}

/**
 * Pre-configured AI providers
 */
export const AI_PROVIDERS: Record<string, AIProvider> = {
  // Local OpenAI-compatible servers
  textGenWebUI: {
    id: "text-gen-webui",
    name: "text-generation-webui",
    description: "Local text-generation-webui with OpenAI API extension",
    endpoint: "http://localhost:5000/v1",
    apiKey: "sk-local-key",
    models: ["gpt-3.5-turbo", "gpt-4", "local-model"],
    features: {
      chatCompletion: true,
      streaming: true,
      multimodal: false,
      functionCalling: false,
    },
  },

  ollama: {
    id: "ollama",
    name: "Ollama",
    description: "Ollama with OpenAI compatibility layer",
    endpoint: "http://localhost:11434/v1",
    apiKey: "ollama",
    models: ["llama2", "codellama", "mistral", "neural-chat"],
    features: {
      chatCompletion: true,
      streaming: true,
      multimodal: false,
      functionCalling: false,
    },
  },

  localAI: {
    id: "local-ai",
    name: "LocalAI",
    description: "LocalAI OpenAI-compatible API",
    endpoint: "http://localhost:8080/v1",
    apiKey: "local-ai-key",
    models: ["gpt-3.5-turbo", "gpt-4", "claude-instant"],
    features: {
      chatCompletion: true,
      streaming: true,
      multimodal: true,
      functionCalling: true,
    },
  },

  lmStudio: {
    id: "lm-studio",
    name: "LM Studio",
    description: "LM Studio local server with OpenAI API",
    endpoint: "http://localhost:1234/v1",
    apiKey: "lm-studio",
    models: ["local-model"],
    features: {
      chatCompletion: true,
      streaming: true,
      multimodal: false,
      functionCalling: false,
    },
  },

  // Cloud providers (for reference)
  openai: {
    id: "openai",
    name: "OpenAI",
    description: "Official OpenAI API",
    endpoint: "https://api.openai.com/v1",
    apiKey: "sk-your-openai-key",
    models: ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo-preview"],
    features: {
      chatCompletion: true,
      streaming: true,
      multimodal: true,
      functionCalling: true,
    },
  },

  anthropic: {
    id: "anthropic",
    name: "Anthropic Claude",
    description: "Anthropic Claude API",
    endpoint: "https://api.anthropic.com/v1",
    apiKey: "sk-ant-your-key",
    models: ["claude-3-haiku", "claude-3-sonnet", "claude-3-opus"],
    features: {
      chatCompletion: true,
      streaming: true,
      multimodal: true,
      functionCalling: true,
    },
  },
};

/**
 * Default configuration for local development
 */
export const DEFAULT_AI_CONFIG = {
  provider: "text-gen-webui",
  model: "gpt-3.5-turbo",
  temperature: 0.7,
  maxTokens: 1000,
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  fallbackToRuleBased: true,
};

/**
 * Shopping-specific prompts and settings
 */
export const SHOPPING_PROMPTS = {
  systemPrompt: `You are a helpful AI shopping assistant for Souqify, an e-commerce platform. Your role is to:

1. Help users find products they're looking for
2. Provide product recommendations based on their preferences  
3. Answer questions about orders, delivery, and store policies
4. Assist with cart management and checkout process
5. Provide helpful shopping advice and comparisons

Guidelines:
- Be friendly, helpful, and concise
- When mentioning specific products, include their IDs in your response like "Product ID: [id]"
- When mentioning orders, include order IDs like "Order ID: [id]" 
- Suggest actions like "add to cart", "view details", or "track order" when appropriate
- If you don't have specific information, acknowledge limitations and suggest alternatives
- Focus on helping users complete their shopping goals

Always maintain a helpful and professional tone while being conversational and engaging.`,

  productSearchPrompt: `Help the user find products based on their search query. Consider:
- Product categories and specifications
- Price ranges and budget constraints
- Brand preferences
- Use cases and requirements
- Quality and reviews

Provide specific product recommendations with IDs when possible.`,

  orderHelpPrompt: `Assist the user with order-related queries including:
- Order status and tracking
- Delivery information
- Returns and exchanges
- Payment issues
- Order modifications

Be helpful and provide clear next steps.`,

  recommendationPrompt: `Provide personalized product recommendations based on:
- User's browsing and purchase history
- Current trends and popular items  
- Seasonal relevance
- Complementary products
- Price considerations

Make recommendations feel natural and helpful.`,
};

/**
 * Error handling configurations
 */
export const ERROR_CONFIGS = {
  connectionTimeout: {
    message:
      "AI service is taking longer than expected. Switching to basic responses.",
    fallback: true,
  },

  rateLimited: {
    message: "AI service is busy. Please try again in a moment.",
    fallback: true,
    retryAfter: 5000, // 5 seconds
  },

  invalidResponse: {
    message: "AI service returned an unexpected response. Using fallback.",
    fallback: true,
  },

  serverError: {
    message: "AI service is temporarily unavailable. Using basic responses.",
    fallback: true,
  },
};

/**
 * Performance and quality settings
 */
export const PERFORMANCE_SETTINGS = {
  // Response time thresholds (milliseconds)
  responseTimeThresholds: {
    fast: 1000, // Under 1 second
    normal: 3000, // Under 3 seconds
    slow: 10000, // Under 10 seconds
  },

  // Quality vs speed trade-offs
  qualityProfiles: {
    speed: {
      temperature: 0.3,
      maxTokens: 300,
      model: "gpt-3.5-turbo",
    },
    balanced: {
      temperature: 0.7,
      maxTokens: 600,
      model: "gpt-3.5-turbo",
    },
    quality: {
      temperature: 0.8,
      maxTokens: 1000,
      model: "gpt-4",
    },
  },

  // Caching settings
  caching: {
    enabled: true,
    ttl: 300000, // 5 minutes
    maxSize: 100, // Maximum cached responses
  },
};

/**
 * Get provider configuration by ID
 */
export function getProviderConfig(providerId: string): AIProvider | null {
  return AI_PROVIDERS[providerId] || null;
}

/**
 * Get all available local providers
 */
export function getLocalProviders(): AIProvider[] {
  return Object.values(AI_PROVIDERS).filter(
    (provider) =>
      provider.endpoint.includes("localhost") ||
      provider.endpoint.includes("127.0.0.1")
  );
}

/**
 * Validate provider configuration
 */
export function validateProviderConfig(provider: AIProvider): boolean {
  return !!(
    provider.id &&
    provider.name &&
    provider.endpoint &&
    provider.models.length > 0 &&
    provider.features.chatCompletion
  );
}

/**
 * Create a custom provider configuration
 */
export function createCustomProvider(
  id: string,
  name: string,
  endpoint: string,
  options: Partial<AIProvider> = {}
): AIProvider {
  return {
    id,
    name,
    description: options.description || `Custom AI provider: ${name}`,
    endpoint,
    apiKey: options.apiKey || "custom-key",
    models: options.models || ["gpt-3.5-turbo"],
    features: {
      chatCompletion: true,
      streaming: false,
      multimodal: false,
      functionCalling: false,
      ...options.features,
    },
  };
}
