interface AIMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}
interface AIResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
      tool_calls?: ToolCall[];
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
      tool_calls?: ToolCall[];
    };
    finish_reason?: string;
  }>;
}
interface Tool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: object;
  };
}
interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}
interface ChatCompletionRequest {
  model: string;
  messages: AIMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
  tools?: Tool[];
}
class AIService {
  private baseURL = "http://127.0.0.1:1234/v1";
  private defaultModel = "gpt-3.5-turbo"; // You can change this to match your local model
  private tools: Tool[] = [];
  constructor() {
    fetch("http://localhost:7855/tools", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched tools data:", data);
        if (Array.isArray(data)) {
          // Transform to OpenAI format
          this.tools = data.map((tool: any) => ({
            type: "function",
            function: {
              name: tool.name,
              description: tool.description,
              parameters: tool.inputSchema, // Assuming inputSchema is the parameters object
            },
          }));
        } else {
          console.warn("Tools data is not an array, setting to empty:", data);
          this.tools = [];
        }
      })
      .catch((error) => {
        console.error("Failed to fetch tools:", error);
        this.tools = []; // Fallback to empty array
      });
  }
  private getEndpoint(_modelId: string): {
    baseURL: string;
    headers: Record<string, string>;
  } {
    // Qwen model running on localhost:1234
    return {
      baseURL: "http://localhost:1234/v1",
      headers: {
        "Content-Type": "application/json",
      },
    };
  }
  async chatCompletion(
    messages: AIMessage[],
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      tools?: Tool[];
    }
  ): Promise<{ content: string; tool_calls?: ToolCall[] }> {
    try {
      const model = options?.model || this.defaultModel;
      const endpoint = this.getEndpoint(model);
      const requestBody: ChatCompletionRequest = {
        model,
        messages,
        max_tokens: options?.maxTokens || 1000,
        temperature: options?.temperature || 0.7,
        stream: false,
        tools: this.tools.length > 0 ? this.tools : undefined, // Only include tools if available
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
        const message = data.choices[0].message;
        return {
          content: message.content,
          tool_calls: message.tool_calls,
        };
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
          "You are a helpful AI assistant for Biqpod.Snapbuy, an e-commerce platform. You can help users with product searches, order management, store operations, and general questions about the platform. Use the available tools when appropriate. Be friendly, concise, and helpful.",
      },
      ...conversationHistory,
      {
        role: "user",
        content: userMessage,
      },
    ];
    const result = await this.chatCompletion(messages, options);
    if (result.tool_calls && result.tool_calls.length > 0) {
      // Execute tools and get results
      const toolMessages = await this.executeToolCalls(result.tool_calls);
      messages.push({
        role: "assistant",
        content: result.content,
        tool_calls: result.tool_calls,
      });
      messages.push(...toolMessages);
      // Call again for final response
      const finalResult = await this.chatCompletion(messages, {
        ...options,
        tools: undefined,
      }); // No tools for final
      return finalResult.content;
    }
    return result.content;
  }
  private async executeToolCalls(toolCalls: ToolCall[]): Promise<AIMessage[]> {
    const toolMessages: AIMessage[] = [];
    for (const toolCall of toolCalls) {
      try {
        const result = await this.callTool(
          toolCall.function.name,
          JSON.parse(toolCall.function.arguments)
        );
        toolMessages.push({
          role: "tool",
          content: JSON.stringify(result),
          tool_call_id: toolCall.id,
        });
      } catch (error) {
        toolMessages.push({
          role: "tool",
          content: `Error executing tool ${toolCall.function.name}: ${error}`,
          tool_call_id: toolCall.id,
        });
      }
    }
    return toolMessages;
  }
  private async callTool(name: string, args: any): Promise<any> {
    switch (name) {
      case "search_products":
        return this.searchProducts(args.query);
      case "get_order_status":
        return this.getOrderStatus(args.order_id);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
  private async searchProducts(query: string): Promise<any> {
    // Mock implementation - in real app, call your product API
    return {
      products: [
        { id: 1, name: "Product A", price: 10.99 },
        { id: 2, name: "Product B", price: 15.99 },
      ].filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
    };
  }
  private async getOrderStatus(orderId: string): Promise<any> {
    // Mock implementation
    return {
      order_id: orderId,
      status: "shipped",
      tracking: "123456789",
    };
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
          "You are a helpful AI assistant for Biqpod.Snapbuy, an e-commerce platform. You can help users with product searches, order management, store operations, and general questions about the platform. Use the available tools when appropriate. Be friendly, concise, and helpful.",
      },
      ...conversationHistory,
      {
        role: "user",
        content: userMessage,
      },
    ];
    // First, check for tool calls without streaming
    const initialResult = await this.chatCompletion(messages, options);
    if (initialResult.tool_calls && initialResult.tool_calls.length > 0) {
      // Execute tools and get results
      const toolMessages = await this.executeToolCalls(
        initialResult.tool_calls
      );
      messages.push({
        role: "assistant",
        content: initialResult.content,
        tool_calls: initialResult.tool_calls,
      });
      messages.push(...toolMessages);
      // Now stream the final response without tools
      await this.streamFinalResponse(messages, onChunk, options);
    } else {
      // No tools, stream directly
      await this.streamDirect(messages, onChunk, options);
    }
  }
  private async streamDirect(
    messages: AIMessage[],
    onChunk: (chunk: string) => void,
    options?: { model?: string }
  ): Promise<void> {
    const model = options?.model || this.defaultModel;
    const endpoint = this.getEndpoint(model);
    const requestBody: ChatCompletionRequest = {
      model,
      messages,
      max_tokens: 1000,
      temperature: 0.05,
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
  private async streamFinalResponse(
    messages: AIMessage[],
    onChunk: (chunk: string) => void,
    options?: { model?: string }
  ): Promise<void> {
    const model = options?.model || this.defaultModel;
    const endpoint = this.getEndpoint(model);
    const requestBody: ChatCompletionRequest = {
      model,
      messages,
      max_tokens: 1000,
      temperature: 0.05,
      stream: true,
      tools: undefined, // No tools for final response
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
    return (await this.chatCompletion(messages, options)).content;
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
    return (await this.chatCompletion(messages, options)).content;
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
