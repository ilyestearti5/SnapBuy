# OpenAI Integration for SnapBuy

This document explains how to set up and use the OpenAI integration in SnapBuy, which allows the AI assistant to use OpenAI-compatible APIs running locally on `localhost:5000/v1`.

## Overview

The SnapBuy AI assistant now supports two modes:

1. **Rule-based responses** (fallback) - Uses predefined logic for basic interactions
2. **OpenAI-powered responses** - Uses OpenAI-compatible API for intelligent, contextual responses

## Setup

### 1. Local OpenAI-Compatible Server

You need to run an OpenAI-compatible server locally. Here are some popular options:

#### Option A: text-generation-webui

```bash
# Install text-generation-webui
git clone https://github.com/oobabooga/text-generation-webui.git
cd text-generation-webui
pip install -r requirements.txt

# Run with OpenAI API compatibility
python server.py --api --listen --port 5000 --extensions openai
```

#### Option B: Ollama with OpenAI Compatibility

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model (e.g., llama2)
ollama pull llama2

# Run with OpenAI compatibility (requires additional setup)
# See Ollama documentation for OpenAI API compatibility
```

#### Option C: LocalAI

```bash
# Using Docker
docker run -p 5000:8080 localai/localai:latest
```

#### Option D: LM Studio

1. Download and install LM Studio
2. Load a model
3. Start the local server on port 5000
4. Enable OpenAI API compatibility in settings

### 2. Configure SnapBuy

1. Open SnapBuy application
2. Navigate to AI Assistant (chat interface)
3. Click the settings icon (⚙️)
4. Expand "OpenAI Configuration" section
5. Configure the following:
   - **Use OpenAI Compatible API**: ✅ Enable
   - **API Endpoint**: `http://localhost:5000/v1`
   - **API Key**: `sk-local-key` (or your actual key if required)
6. Click "Test Connection" to verify setup
7. Click "Save Settings"

## Features

### Intelligent Responses

The OpenAI integration provides:

- **Contextual understanding** of shopping queries
- **Natural conversation flow** with memory of previous messages
- **Product recommendations** based on user preferences
- **Smart product search** with natural language understanding
- **Order assistance** and tracking help

### Enhanced Product Discovery

When using OpenAI mode, the assistant can:

- Understand complex product queries ("I need a laptop for gaming under $1500")
- Provide detailed product comparisons
- Suggest alternatives and upgrades
- Give personalized recommendations

### Automatic Fallback

If the OpenAI service is unavailable, the system automatically falls back to rule-based responses to ensure the assistant remains functional.

## API Compatibility

### Required Endpoints

Your OpenAI-compatible server must support:

1. **GET /v1/models**

   ```json
   {
     "object": "list",
     "data": [
       {
         "id": "gpt-3.5-turbo",
         "object": "model",
         "created": 1677610602,
         "owned_by": "openai"
       }
     ]
   }
   ```

2. **POST /v1/chat/completions**
   ```json
   {
     "model": "gpt-3.5-turbo",
     "messages": [
       { "role": "system", "content": "You are a helpful assistant." },
       { "role": "user", "content": "Hello!" }
     ],
     "temperature": 0.7,
     "max_tokens": 1000
   }
   ```

### Request Headers

```
Authorization: Bearer sk-local-key
Content-Type: application/json
```

## Troubleshooting

### Common Issues

1. **Connection Failed**

   - Verify your server is running on `localhost:5000`
   - Check that the OpenAI API extension is enabled
   - Ensure no firewall is blocking the connection

2. **"Models not found" Error**

   - Make sure your server supports the `/v1/models` endpoint
   - Verify the model is loaded in your local server

3. **Slow Responses**

   - Check your model size and hardware capabilities
   - Consider using a smaller, faster model for real-time chat
   - Reduce `max_tokens` in the configuration

4. **API Key Issues**
   - Some local servers don't require API keys
   - Try using `sk-local-key` or an empty string
   - Check your server's authentication requirements

### Testing

Use the test script provided in `test-openai.ts`:

```javascript
// In browser console
import { testOpenAiService } from "./test-openai.ts";
testOpenAiService();
```

### Debug Mode

Enable debug logging in browser console to see API requests and responses:

```javascript
// Enable debug mode
localStorage.setItem("snapbuy-ai-debug", "true");

// View logs in browser console during AI interactions
```

## Best Practices

### Model Selection

- **Fast models** (e.g., Llama 2 7B) for real-time chat
- **Larger models** (e.g., Llama 2 13B/70B) for better quality responses
- **Specialized models** trained on e-commerce/shopping data if available

### Performance Optimization

- Use **streaming responses** for better user experience
- Implement **response caching** for common queries
- Set appropriate **token limits** to balance quality and speed

### Security

- Run the AI server on localhost only (don't expose to internet)
- Use proper authentication if required
- Monitor resource usage to prevent abuse

## Advanced Configuration

### Custom System Prompts

The OpenAI service uses specialized prompts for shopping assistance. You can customize these in the `OpenAiService.ts` file.

### Multiple Models

Configure different models for different tasks:

- Fast model for quick responses
- Specialized model for product recommendations
- Larger model for complex queries

### Integration with SnapBuy Data

The AI assistant automatically includes relevant context:

- Current store information
- User's shopping history
- Available products
- Order status

## Support

For issues and questions:

1. Check the browser console for error messages
2. Verify your local server logs
3. Test the connection using the built-in test feature
4. Refer to your OpenAI-compatible server documentation

## Future Enhancements

Planned features:

- **Streaming responses** for real-time typing indicators
- **Multiple model support** for different types of queries
- **Voice integration** with speech-to-text and text-to-speech
- **Image understanding** for visual product search
- **Advanced personalization** based on shopping patterns
