// Debug helper for OpenAI service
// Call this from browser console to test the service

import { openAiService } from "./src/services/OpenAiService";
import { aiAgentService } from "./src/services/AiAgentService";

// Make services available globally for debugging
(window as any).debugOpenAI = {
  openAiService,
  aiAgentService,

  // Test OpenAI connection
  async testConnection() {
    console.log("🔗 Testing OpenAI connection...");
    try {
      const isConnected = await openAiService.checkConnection();
      console.log("Connection result:", isConnected);
      return isConnected;
    } catch (error) {
      console.error("Connection test failed:", error);
      return false;
    }
  },

  // Test getting models
  async testModels() {
    console.log("📋 Testing models endpoint...");
    try {
      const models = await openAiService.getModels();
      console.log("Models:", models);
      return models;
    } catch (error) {
      console.error("Models test failed:", error);
      return [];
    }
  },

  // Test simple completion
  async testCompletion(message = "Hello, how are you?") {
    console.log("💬 Testing chat completion...");
    try {
      const response = await openAiService.generateResponse(message);
      console.log("Response:", response);
      return response;
    } catch (error) {
      console.error("Completion test failed:", error);
      return null;
    }
  },

  // Test the full conversation flow
  async testConversation(message = "Hello", userId = "test-user") {
    console.log("🗣️ Testing full conversation flow...");
    try {
      const result = await aiAgentService.processConversation(userId, message);
      console.log("Conversation result:", result);
      return result;
    } catch (error) {
      console.error("Conversation test failed:", error);
      return null;
    }
  },

  // Get current configuration
  getConfig() {
    return {
      baseURL: openAiService.getBaseURL(),
      defaultModel: openAiService.getDefaultModel(),
      endpoint: openAiService.getBaseURL() + "/chat/completions",
    };
  },

  // Manual fetch test
  async testFetch() {
    const config = this.getConfig();
    console.log("🌐 Testing manual fetch to:", config.endpoint);

    try {
      const response = await fetch(config.baseURL + "/models", {
        method: "GET",
        headers: {
          Authorization: "Bearer sk-local-key",
          "Content-Type": "application/json",
        },
      });

      console.log("Fetch response:", {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Response data:", data);
        return data;
      } else {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        return null;
      }
    } catch (error) {
      console.error("Fetch test failed:", error);
      return null;
    }
  },
};

console.log("🔧 OpenAI Debug tools loaded! Available commands:");
console.log("- debugOpenAI.testConnection()");
console.log("- debugOpenAI.testModels()");
console.log("- debugOpenAI.testCompletion('your message')");
console.log("- debugOpenAI.testConversation('your message')");
console.log("- debugOpenAI.getConfig()");
console.log("- debugOpenAI.testFetch()");

export {};
