/**
 * Test script for OpenAI Service
 * This file can be used to test the OpenAI service functionality
 */

import { openAiService } from "./src/services/OpenAiService";

// Test configuration
const TEST_CONFIG = {
  endpoint: "http://localhost:5000/v1",
  apiKey: "sk-local-key",
  model: "gpt-3.5-turbo",
};

/**
 * Test the OpenAI service connection and basic functionality
 */
async function testOpenAiService() {
  console.log("🚀 Starting OpenAI Service Tests...\n");

  try {
    // Configure the service
    openAiService.setBaseURL(TEST_CONFIG.endpoint);
    openAiService.setApiKey(TEST_CONFIG.apiKey);
    openAiService.setDefaultModel(TEST_CONFIG.model);

    console.log(`📍 Testing endpoint: ${TEST_CONFIG.endpoint}`);
    console.log(`🔑 Using API key: ${TEST_CONFIG.apiKey}`);
    console.log(`🤖 Default model: ${TEST_CONFIG.model}\n`);

    // Test 1: Check connection
    console.log("Test 1: Checking connection...");
    const isConnected = await openAiService.checkConnection();
    console.log(
      `Connection status: ${isConnected ? "✅ Connected" : "❌ Failed"}\n`
    );

    if (!isConnected) {
      console.log(
        "❌ Connection failed. Make sure your OpenAI-compatible server is running on localhost:5000"
      );
      return;
    }

    // Test 2: Get available models
    console.log("Test 2: Fetching available models...");
    try {
      const models = await openAiService.getModels();
      console.log(`✅ Found ${models.length} models:`);
      models.forEach((model) => {
        console.log(`  - ${model.id} (owned by: ${model.owned_by})`);
      });
      console.log("");
    } catch (error) {
      console.log(`❌ Failed to fetch models: ${error}\n`);
    }

    // Test 3: Simple chat completion
    console.log("Test 3: Testing simple chat completion...");
    try {
      const response = await openAiService.generateResponse(
        "Hello! Can you help me with shopping?",
        [],
        "You are a helpful shopping assistant."
      );
      console.log("✅ Chat completion successful:");
      console.log(`Response: ${response}\n`);
    } catch (error) {
      console.log(`❌ Chat completion failed: ${error}\n`);
    }

    // Test 4: Shopping assistant response
    console.log("Test 4: Testing shopping assistant response...");
    try {
      const shoppingResponse = await openAiService.generateShoppingResponse(
        "I'm looking for a laptop under $1000",
        [],
        {
          storeId: "test-store",
          userName: "test-user",
        }
      );
      console.log("✅ Shopping assistant response successful:");
      console.log(`Response: ${shoppingResponse}\n`);
    } catch (error) {
      console.log(`❌ Shopping assistant response failed: ${error}\n`);
    }

    console.log("🎉 All tests completed!");
  } catch (error) {
    console.error("💥 Test suite failed:", error);
  }
}

// Export for use in other files
export { testOpenAiService };

// Instructions for manual testing
console.log(`
📋 Manual Testing Instructions:

1. Start your OpenAI-compatible server:
   - Make sure it's running on http://localhost:5000
   - The server should provide OpenAI-compatible endpoints like /v1/chat/completions

2. Run this test in a browser console:
   - Open your Souqify app
   - Open browser developer tools (F12)
   - Paste this code in the console
   - Call testOpenAiService()

3. Expected endpoints your server should support:
   - GET /v1/models - List available models
   - POST /v1/chat/completions - Create chat completions

4. Example server setup (using text-generation-webui):
   - Install text-generation-webui
   - Run with: python server.py --api --listen --port 5000
   - Enable OpenAI extension
   - API will be available at http://localhost:5000/v1

5. Alternative servers:
   - Ollama with OpenAI compatibility
   - LocalAI
   - FastChat with OpenAI API
   - LM Studio with OpenAI-compatible API

Enjoy using your local AI assistant! 🤖
`);
