interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}
interface AIResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
interface AIStreamChunk {
  choices: Array<{
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason?: string;
  }>;
}
interface ChatCompletionRequest {
  model: string;
  messages: AIMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}
class AIService {
  private baseURL = "http://127.0.0.1:1234/v1";
  private githubBaseURL = "https://models.github.ai/inference";
  private defaultModel = "gpt-3.5-turbo"; // You can change this to match your local model
  private getEndpoint(modelId: string): {
    baseURL: string;
    headers: Record<string, string>;
  } {
    if (modelId.startsWith("anthropic/")) {
      // Anthropic models
      return {
        baseURL: "https://api.anthropic.com/v1",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY || "",
          "anthropic-version": "2023-06-01",
        },
      };
    } else if (modelId.startsWith("google/")) {
      // Google models
      return {
        baseURL: "https://generativelanguage.googleapis.com/v1beta",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GOOGLE_API_KEY || ""}`,
        },
      };
    } else if (
      modelId.startsWith("deepseek/") ||
      modelId.startsWith("deepseek-")
    ) {
      // DeepSeek models
      return {
        baseURL: "https://api.deepseek.com/v1",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY || ""}`,
        },
      };
    } else if (modelId === "qwen2.5-coder-7b-instruct") {
      // Qwen model running on localhost:1234
      return {
        baseURL: "http://localhost:1234/v1",
        headers: {
          "Content-Type": "application/json",
        },
      };
    } else if (modelId.includes("/")) {
      // GitHub model (e.g., "openai/gpt-4.1")
      return {
        baseURL: this.githubBaseURL,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GITHUB_TOKEN || ""}`,
        },
      };
    } else {
      // Local model
      return {
        baseURL: this.baseURL,
        headers: {
          "Content-Type": "application/json",
        },
      };
    }
  }
  async chatCompletion(
    messages: AIMessage[],
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<string> {
    try {
      const model = options?.model || this.defaultModel;
      const endpoint = this.getEndpoint(model);
      const requestBody: ChatCompletionRequest = {
        model,
        messages,
        max_tokens: options?.maxTokens || 1000,
        temperature: options?.temperature || 0.7,
        stream: false,
      };
      const response = await fetch(`${endpoint.baseURL}/chat/completions`, {
        method: "POST",
        headers: endpoint.headers,
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        throw new Error(
          `AI Service Error: ${response.status} ${response.statusText}`
        );
      }
      const data: AIResponse = await response.json();
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      } else {
        throw new Error("No response from AI service");
      }
    } catch (error) {
      console.error("AI Service Error:", error);
      throw error;
    }
  }
  async sendMessage(
    userMessage: string,
    conversationHistory: AIMessage[] = [],
    options?: { model?: string }
  ): Promise<string> {
    // Build the conversation context
    const messages: AIMessage[] = [
      {
        role: "system",
        content:
          "You are a helpful AI assistant for Snapbuy, an e-commerce platform. You can help users with product searches, order management, store operations, and general questions about the platform. Be friendly, concise, and helpful.",
      },
      ...conversationHistory,
      {
        role: "user",
        content: userMessage,
      },
    ];
    return await this.chatCompletion(messages, options);
  }
  // Send a streaming message to the AI
  async sendStreamingMessage(
    userMessage: string,
    conversationHistory: AIMessage[] = [],
    onChunk: (chunk: string) => void,
    options?: { model?: string }
  ): Promise<void> {
    // Build the conversation context
    const messages: AIMessage[] = [
      {
        role: "system",
        content:
          "You are a helpful AI assistant for Snapbuy, an e-commerce platform. You can help users with product searches, order management, store operations, and general questions about the platform. Be friendly, concise, and helpful.",
      },
      ...conversationHistory,
      {
        role: "user",
        content: userMessage,
      },
    ];
    const model = options?.model || this.defaultModel;
    const endpoint = this.getEndpoint(model);
    const requestBody: ChatCompletionRequest = {
      model,
      messages,
      max_tokens: 1000,
      temperature: 0.7,
      stream: true,
    };
    const response = await fetch(`${endpoint.baseURL}/chat/completions`, {
      method: "POST",
      headers: endpoint.headers,
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      throw new Error(
        `AI service error: ${response.status} ${response.statusText}`
      );
    }
    if (!response.body) {
      throw new Error("No response body received");
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;
          const data = trimmedLine.slice(6);
          if (data === "[DONE]") {
            return;
          }
          try {
            const chunk: AIStreamChunk = JSON.parse(data);
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
          } catch (parseError) {
            console.warn("Failed to parse chunk:", data);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
  async analyzeImage(
    _imageBase64: string,
    userMessage?: string,
    options?: { model?: string }
  ): Promise<string> {
    // For image analysis, we'll send a special prompt
    const messages: AIMessage[] = [
      {
        role: "system",
        content:
          "You are an AI assistant that can analyze images. Describe what you see in the image and help the user with any questions they have about it.",
      },
      {
        role: "user",
        content: userMessage
          ? `${userMessage}\n\n[Image provided but cannot be displayed in text format]`
          : "Please analyze this image and describe what you see. [Image provided but cannot be displayed in text format]",
      },
    ];
    return await this.chatCompletion(messages, options);
  }
  async analyzeFiles(
    files: Array<{ type: string; name: string }>,
    userMessage?: string,
    options?: { model?: string }
  ): Promise<string> {
    const fileDescriptions = files
      .map((file) => {
        if (file.type.startsWith("image/")) {
          return `Image file (${file.type})`;
        } else if (file.type.startsWith("video/")) {
          return `Video file (${file.type})`;
        } else if (file.type.startsWith("audio/")) {
          return `Audio file (${file.type})`;
        } else if (file.type.includes("pdf")) {
          return `PDF document`;
        } else if (
          file.type.includes("document") ||
          file.type.includes("word")
        ) {
          return `Word document`;
        } else if (
          file.type.includes("spreadsheet") ||
          file.type.includes("excel")
        ) {
          return `Excel spreadsheet`;
        } else {
          return `File (${file.type})`;
        }
      })
      .join(", ");
    const messages: AIMessage[] = [
      {
        role: "system",
        content:
          "You are an AI assistant helping users with file analysis. The user has shared some files with you.",
      },
      {
        role: "user",
        content: userMessage
          ? `${userMessage}\n\nFiles shared: ${fileDescriptions}`
          : `I've shared these files with you: ${fileDescriptions}. Can you help me with them?`,
      },
    ];
    return await this.chatCompletion(messages, options);
  }
  // Health check to verify AI service is available
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.ok;
    } catch (error) {
      console.error("AI Service health check failed:", error);
      return false;
    }
  }
  // Get available models
  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        return data.data?.map((model: any) => model.id) || [];
      }
      return [];
    } catch (error) {
      console.error("Failed to get AI models:", error);
      return [];
    }
  }
}
export const aiService = new AIService();
export type { AIMessage };
