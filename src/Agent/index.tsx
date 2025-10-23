import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  CircleTip,
  Field,
  Icon,
  Line,
  Tip,
  UserAvatar,
} from "@biqpod/app/ui/components";
import {
  getFieldValue,
  setFieldValue,
  showToast,
  useUser,
} from "@biqpod/app/ui/hooks";
import { tw } from "@biqpod/app/ui/utils";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import chatBotSrc from "../../assets/Bot Face.mp4";
import { aiService, AIMessage } from "../apis/aiService";
import { openPath } from "@biqpod/app/ui/shared";
import AnimatedMarkdownRenderer from "../components/AnimatedMarkdownRenderer";
interface FileAttachment {
  name: string;
  size: number;
  type: string;
  url: string; // URL or base64 string
  lastModified?: number;
}
interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  attachments?: FileAttachment[]; // Array of file attachments
}

interface AIModel {
  id: string;
  name: string;
  provider: string;
  description?: string;
  logo: string; // URL or path to model logo
}

const AVAILABLE_MODELS: AIModel[] = [
  // Local Models
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "Local",
    description: "Local model running on localhost",
    logo: "https://static.vecteezy.com/system/resources/previews/022/227/364/non_2x/openai-chatgpt-logo-icon-free-png.png",
  },

  // OpenAI Models via GitHub
  {
    id: "openai/gpt-4.1",
    name: "GPT-4.1",
    provider: "OpenAI via GitHub",
    description: "Latest GPT-4.1 model",
    logo: "https://static.vecteezy.com/system/resources/previews/022/227/364/non_2x/openai-chatgpt-logo-icon-free-png.png",
  },
  {
    id: "openai/gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    provider: "OpenAI via GitHub",
    description: "Faster, more affordable GPT-4.1",
    logo: "https://static.vecteezy.com/system/resources/previews/022/227/364/non_2x/openai-chatgpt-logo-icon-free-png.png",
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI via GitHub",
    description: "Multimodal GPT-4o",
    logo: "https://static.vecteezy.com/system/resources/previews/022/227/364/non_2x/openai-chatgpt-logo-icon-free-png.png",
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI via GitHub",
    description: "Efficient GPT-4o variant",
    logo: "https://static.vecteezy.com/system/resources/previews/022/227/364/non_2x/openai-chatgpt-logo-icon-free-png.png",
  },
  {
    id: "openai/o1",
    name: "o1",
    provider: "OpenAI via GitHub",
    description: "Advanced reasoning model",
    logo: "https://static.vecteezy.com/system/resources/previews/022/227/364/non_2x/openai-chatgpt-logo-icon-free-png.png",
  },
  {
    id: "openai/o1-mini",
    name: "o1 Mini",
    provider: "OpenAI via GitHub",
    description: "Faster reasoning model",
    logo: "https://static.vecteezy.com/system/resources/previews/022/227/364/non_2x/openai-chatgpt-logo-icon-free-png.png",
  },

  // Claude Models
  {
    id: "anthropic/claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    description: "Advanced reasoning and creative capabilities",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Claude_AI_symbol.svg/2048px-Claude_AI_symbol.svg.png",
  },
  {
    id: "anthropic/claude-4-sonnet",
    name: "Claude Sonnet 4",
    provider: "Anthropic",
    description: "Next-generation Claude with enhanced capabilities",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Claude_AI_symbol.svg/2048px-Claude_AI_symbol.svg.png",
  },

  // Meta Models
  {
    id: "meta/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B",
    provider: "Meta via GitHub",
    description: "Enhanced Llama 3.3",
    logo: "https://cdn-icons-png.flaticon.com/512/6033/6033716.png",
  },

  // Microsoft Models
  {
    id: "microsoft/phi-4",
    name: "Phi-4",
    provider: "Microsoft via GitHub",
    description: "High capability 14B model",
    logo: "https://www.svgrepo.com/show/452062/microsoft.svg",
  },

  // Mistral Models
  {
    id: "mistral-ai/mistral-large-2411",
    name: "Mistral Large",
    provider: "Mistral via GitHub",
    description: "Enhanced reasoning and function calling",
    logo: "https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/mistral-ai-icon.png",
  },

  // Google Models
  {
    id: "google/gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "Google",
    description: "Advanced multimodal capabilities",
    logo: "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  },
  {
    id: "google/gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    provider: "Google",
    description: "Fast and efficient multimodal model",
    logo: "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  },

  // DeepSeek Models
  {
    id: "deepseek/deepseek-r1",
    name: "DeepSeek-R1",
    provider: "DeepSeek",
    description:
      "Excels at reasoning (language, science, coding) via step-by-step training",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/DeepSeek-icon.svg/512px-DeepSeek-icon.svg.png?20250630230357",
  },
  {
    id: "deepseek/deepseek-r1-0528",
    name: "DeepSeek-R1-0528",
    provider: "DeepSeek",
    description:
      "Improved reasoning, reduced hallucination, better function calling",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/DeepSeek-icon.svg/512px-DeepSeek-icon.svg.png?20250630230357",
  },
  {
    id: "deepseek/deepseek-v3-0324",
    name: "DeepSeek-V3-0324",
    provider: "DeepSeek",
    description:
      "Notable improvements in reasoning, function calling, and code generation",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/DeepSeek-icon.svg/512px-DeepSeek-icon.svg.png?20250630230357",
  },
  {
    id: "deepseek-coder-v2",
    name: "DeepSeek Coder V2",
    provider: "DeepSeek",
    description:
      "Specialized coding model with enhanced programming capabilities",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/DeepSeek-icon.svg/512px-DeepSeek-icon.svg.png?20250630230357",
  },

  // Qwen Models (Local)
  {
    id: "qwen2.5-coder-7b-instruct",
    name: "Qwen2.5 Coder 7B Instruct",
    provider: "Local (Qwen)",
    description: "Local coding-specialized model running on localhost:1234",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Qwen_logo.svg/1024px-Qwen_logo.svg.png",
  },
];
export const AgentAi = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const inputValue = getFieldValue("chat-input") || "";
  const [selectedFiles, setSelectedFiles] = useState<FileAttachment[]>([]);
  const [conversationHistory, setConversationHistory] = useState<AIMessage[]>(
    []
  );
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );
  const [selectedModel, setSelectedModel] = useState<AIModel>(
    AVAILABLE_MODELS[0]
  );
  const [showModelSelector, setShowModelSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modelSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close model selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modelSelectorRef.current &&
        !modelSelectorRef.current.contains(event.target as Node)
      ) {
        setShowModelSelector(false);
      }
    };

    if (showModelSelector) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showModelSelector]);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  // Function to get file icon based on file type
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return allIcons.solid.faImage;
    if (fileType.startsWith("video/")) return allIcons.solid.faVideo;
    if (fileType.startsWith("audio/")) return allIcons.solid.faMusic;
    if (fileType.includes("pdf")) return allIcons.solid.faFilePdf;
    if (fileType.includes("document") || fileType.includes("word"))
      return allIcons.solid.faFileWord;
    if (fileType.includes("spreadsheet") || fileType.includes("excel"))
      return allIcons.solid.faFileExcel;
    if (fileType.includes("presentation") || fileType.includes("powerpoint"))
      return allIcons.solid.faFilePowerpoint;
    if (
      fileType.includes("zip") ||
      fileType.includes("rar") ||
      fileType.includes("archive")
    )
      return allIcons.solid.faFileZipper;
    if (fileType.includes("text")) return allIcons.solid.faFileText;
    return allIcons.solid.faFile;
  };
  // Function to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
  // Function to handle file selection
  const handleFileSelect = async () => {
    try {
      const files = await openPath({
        filters: [
          {
            name: "All Files",
            extensions: ["*"],
          },
        ],
        properties: ["multiSelections"],
      });
      if (files && files.length > 0) {
        const newFiles: FileAttachment[] = files.map((filePath: string) => {
          // Extract file type from base64 data URL
          let fileType = "application/octet-stream";
          let fileName = "file";

          if (filePath.startsWith("data:")) {
            // Extract MIME type from base64 data URL (e.g., "data:image/jpeg;base64,...")
            const mimeMatch = filePath.match(/^data:([^;]+)/);
            if (mimeMatch) {
              fileType = mimeMatch[1];
            }

            // Generate appropriate filename based on MIME type
            if (fileType.startsWith("image/")) {
              const ext = fileType.split("/")[1];
              fileName = `image.${ext === "jpeg" ? "jpg" : ext}`;
            } else if (fileType.startsWith("video/")) {
              const ext = fileType.split("/")[1];
              fileName = `video.${ext}`;
            } else if (fileType.startsWith("audio/")) {
              const ext = fileType.split("/")[1];
              fileName = `audio.${ext}`;
            } else if (fileType === "application/pdf") {
              fileName = "document.pdf";
            } else if (
              fileType.includes("document") ||
              fileType.includes("word")
            ) {
              fileName = "document.docx";
            } else if (
              fileType.includes("spreadsheet") ||
              fileType.includes("excel")
            ) {
              fileName = "spreadsheet.xlsx";
            } else if (fileType.includes("text")) {
              fileName = "text.txt";
            } else {
              fileName = "file";
            }
          } else {
            // Fallback: if it's not a data URL, try to extract from path
            const pathFileName = filePath.split(/[\\/]/).pop() || filePath;
            const fileExtension =
              pathFileName.split(".").pop()?.toLowerCase() || "";
            fileName = pathFileName;

            // Determine file type based on extension as fallback
            if (
              ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(
                fileExtension
              )
            ) {
              fileType = `image/${
                fileExtension === "jpg" ? "jpeg" : fileExtension
              }`;
            } else if (
              ["mp4", "avi", "mov", "wmv", "flv", "webm"].includes(
                fileExtension
              )
            ) {
              fileType = `video/${fileExtension}`;
            } else if (
              ["mp3", "wav", "flac", "aac", "ogg"].includes(fileExtension)
            ) {
              fileType = `audio/${fileExtension}`;
            } else if (fileExtension === "pdf") {
              fileType = "application/pdf";
            } else if (["doc", "docx"].includes(fileExtension)) {
              fileType = "application/msword";
            } else if (["xls", "xlsx"].includes(fileExtension)) {
              fileType = "application/vnd.ms-excel";
            } else if (["txt", "md"].includes(fileExtension)) {
              fileType = "text/plain";
            }
          }

          // Calculate file size from base64 if it's a data URL
          let fileSize = 0;
          if (filePath.startsWith("data:")) {
            const base64Data = filePath.split(",")[1];
            if (base64Data) {
              // Approximate file size from base64 (base64 is ~4/3 the original size)
              fileSize = Math.round((base64Data.length * 3) / 4);
            }
          }

          return {
            name: fileName,
            size: fileSize,
            type: fileType,
            url: filePath,
          };
        });
        setSelectedFiles((prev) => [...prev, ...newFiles]);
      }
    } catch (error) {
      console.error("Error selecting files:", error);
      showToast("Error selecting files", "error");
    }
  };
  const user = useUser();

  // Function to send message to AI and get streaming response
  const sendToAI = async (
    userMessage: string,
    attachments?: FileAttachment[]
  ) => {
    // Create a placeholder message for the AI response
    const aiResponseId = (Date.now() + 1).toString();

    try {
      const aiResponseMessage: Message = {
        id: aiResponseId,
        content: "",
        sender: "ai",
        timestamp: new Date(),
      };

      // Add the empty AI message to show it's starting to respond
      setMessages((prev) => [...prev, aiResponseMessage]);

      // Handle different types of messages
      if (attachments && attachments.length > 0) {
        // Handle file attachments (non-streaming for now)
        const imageAttachments = attachments.filter((file) =>
          file.type.startsWith("image/")
        );
        const otherAttachments = attachments.filter(
          (file) => !file.type.startsWith("image/")
        );

        let aiResponse: string;
        if (imageAttachments.length > 0) {
          // For images, use image analysis with selected model
          aiResponse = await aiService.analyzeImage(
            imageAttachments[0].url,
            userMessage,
            { model: selectedModel.id }
          );
        } else {
          // For other files, analyze file types with selected model
          aiResponse = await aiService.analyzeFiles(
            otherAttachments.map((file) => ({
              type: file.type,
              name: file.name,
            })),
            userMessage,
            { model: selectedModel.id }
          );
        }

        // Update the message with the complete response
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiResponseId ? { ...msg, content: aiResponse } : msg
          )
        );

        // Update conversation history
        const newUserMessage: AIMessage = {
          role: "user",
          content: userMessage,
        };
        const newAIMessage: AIMessage = {
          role: "assistant",
          content: aiResponse,
        };
        setConversationHistory((prev) => [
          ...prev,
          newUserMessage,
          newAIMessage,
        ]);
      } else {
        // Regular text message with streaming
        let accumulatedResponse = "";

        // Set this message as actively streaming
        setStreamingMessageId(aiResponseId);

        await aiService.sendStreamingMessage(
          userMessage,
          conversationHistory,
          (chunk: string) => {
            accumulatedResponse += chunk;

            // Update the message content with the accumulated response
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiResponseId
                  ? { ...msg, content: accumulatedResponse }
                  : msg
              )
            );
          },
          { model: selectedModel.id }
        );

        // Clear streaming state when done
        setStreamingMessageId(null);

        // Update conversation history with the complete response
        const newUserMessage: AIMessage = {
          role: "user",
          content: userMessage,
        };
        const newAIMessage: AIMessage = {
          role: "assistant",
          content: accumulatedResponse,
        };
        setConversationHistory((prev) => [
          ...prev,
          newUserMessage,
          newAIMessage,
        ]);
      }
    } catch (error) {
      console.error("AI Service Error:", error);

      // Clear streaming state
      setStreamingMessageId(null);

      // Remove the placeholder message if it exists
      setMessages((prev) => prev.filter((msg) => msg.id !== aiResponseId));

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content:
          "I'm sorry, I'm having trouble connecting to my AI service right now. Please try again later.",
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      showToast(`AI service error with ${selectedModel.name}`, "error");
    } finally {
    }
  };
  return (
    <motion.div
      className="relative flex flex-col bg-[--biqpod-primary-background] h-full text-[--biqpod-text-color]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Model Selector Header */}
      <motion.div
        className="relative bg-[--biqpod-secondary-background] p-3 border-[--biqpod-borders] border-b"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="flex justify-between items-center mx-auto max-w-4xl">
          <div className="flex items-center gap-3">
            <video
              src={chatBotSrc}
              className="rounded-full w-8 h-8"
              autoPlay
              loop
            />
            <div>
              <h1 className="font-semibold text-lg">Snapbuy AI Assistant</h1>
              <div className="flex items-center gap-2 opacity-70 text-sm">
                <span>Powered by</span>
                <img src={selectedModel.logo} className="rounded w-4 h-4" />
                <CircleTip
                  icon={allIcons.solid.faMicrochip}
                  className="hidden bg-[--biqpod-primary] w-4 h-4 text-[--biqpod-primary-content] header-fallback-icon"
                />
                <button
                  onClick={() => setShowModelSelector(!showModelSelector)}
                  className="flex items-center gap-1 hover:opacity-100 transition-opacity"
                >
                  <span className="font-medium">{selectedModel.name}</span>
                  <span className="text-xs">
                    {showModelSelector ? "▲" : "▼"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tip
              icon={allIcons.solid.faRocket}
              className="bg-[--biqpod-primary] w-8 h-8 text-[--biqpod-primary-content]"
              onClick={async () => {
                try {
                  // Open AI Toolkit Model Playground with the current model
                  const modelName = selectedModel.id.includes("/")
                    ? selectedModel.id.split("/")[1]
                    : selectedModel.id;

                  showToast(
                    `Opening AI Toolkit Playground with ${selectedModel.name}...`,
                    "info"
                  );

                  // Use VS Code command to open playground
                  await (window as any).vscode?.postMessage({
                    command: "ai-mlstudio.modelPlayground",
                    args: JSON.stringify({
                      triggeredFrom: "copilot",
                      initialSelectedModel: {
                        providerName: selectedModel.id.includes("/")
                          ? "GitHub"
                          : "Local",
                        name: modelName,
                      },
                    }),
                  });
                } catch (error) {
                  console.error("Failed to open AI Toolkit:", error);
                  showToast("Failed to open AI Toolkit Playground", "error");
                }
              }}
            />
            <Tip
              icon={allIcons.solid.faLayerGroup}
              className="bg-[--biqpod-secondary] w-8 h-8 text-[--biqpod-text-color]"
              onClick={async () => {
                try {
                  showToast("Opening AI Toolkit Model Catalog...", "info");

                  // Use VS Code command to open model catalog
                  await (window as any).vscode?.postMessage({
                    command: "ai-mlstudio.models",
                    args: JSON.stringify({
                      triggeredFrom: "copilot",
                    }),
                  });
                } catch (error) {
                  console.error("Failed to open Model Catalog:", error);
                  showToast("Failed to open Model Catalog", "error");
                }
              }}
            />
          </div>
        </div>

        {/* Model Selector Dropdown */}
        {showModelSelector && (
          <motion.div
            ref={modelSelectorRef}
            className="top-full right-0 left-0 z-50 absolute bg-[--biqpod-secondary-background] shadow-xl border border-[--biqpod-borders]"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mx-auto p-4 max-w-4xl">
              <h3 className="mb-3 font-semibold">Select AI Model</h3>
              <div className="gap-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-h-96 overflow-y-auto">
                {AVAILABLE_MODELS.map((model) => (
                  <motion.button
                    key={model.id}
                    className={tw(
                      "text-left p-4 rounded-lg border transition-colors",
                      selectedModel.id === model.id
                        ? "bg-[--biqpod-primary] text-[--biqpod-primary-content] border-[--biqpod-primary]"
                        : "bg-[--biqpod-primary-background] border-[--biqpod-borders] hover:bg-[--biqpod-gray-opacity]"
                    )}
                    onClick={() => {
                      setSelectedModel(model);
                      setShowModelSelector(false);
                      showToast(`Switched to ${model.name}`, "success");
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <img
                        src={model.logo}
                        alt={`${model.provider} logo`}
                        className="rounded w-8 h-8 object-contain"
                        onError={(e) => {
                          // Fallback to a generic icon if logo fails to load
                          const img = e.target as HTMLImageElement;
                          img.style.display = "none";
                          const fallbackIcon = img.parentNode?.querySelector(
                            ".fallback-icon"
                          ) as HTMLElement;
                          if (fallbackIcon) fallbackIcon.style.display = "flex";
                        }}
                      />
                      <CircleTip
                        icon={allIcons.solid.faCloud}
                        className={tw(
                          "w-8 h-8 fallback-icon hidden",
                          selectedModel.id === model.id
                            ? "bg-[--biqpod-primary-content] text-[--biqpod-primary]"
                            : "bg-[--biqpod-primary] text-[--biqpod-primary-content]"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{model.name}</div>
                        <div className="opacity-70 text-xs truncate">
                          {model.provider}
                        </div>
                      </div>
                    </div>
                    {model.description && (
                      <div className="opacity-60 text-xs leading-relaxed">
                        {model.description}
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Chat Messages Area */}
      <motion.div
        className="flex-1 space-y-4 p-4 overflow-y-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {messages.length === 0 && (
          <motion.div
            className="flex flex-col justify-center items-center h-full text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <motion.video
              src={chatBotSrc}
              className="mb-4 rounded-full w-16 h-16"
              autoPlay
              loop
              initial={{ opacity: 0, rotate: -10 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            />
            <motion.h2
              className="mb-2 font-semibold text-[--biqpod-text-color] text-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
            >
              Welcome to Snapbuy AI Assistant
            </motion.h2>
            <motion.p
              className="opacity-70 max-w-md text-[--biqpod-text-color]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.9 }}
            >
              I'm here to help you with your shopping needs. Ask me anything or
              share files to get started!
            </motion.p>
          </motion.div>
        )}

        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            className={tw(
              "flex items-start gap-2",
              message.sender === "user" ? "justify-end" : "justify-start"
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: index === messages.length - 1 ? 0 : 0,
              ease: "easeOut",
            }}
          >
            {/* AI Avatar */}
            {message.sender === "ai" && (
              <video
                src={chatBotSrc}
                className="rounded-full w-8 h-8"
                autoPlay
                loop
              />
            )}
            <Card
              className={tw(
                "max-w-[75%] rounded-xl p-3 relative group",
                message.sender === "user" &&
                  "bg-[--biqpod-primary] text-[--biqpod-primary-content] rounded-br"
              )}
            >
              {message.sender === "ai" ? (
                <AnimatedMarkdownRenderer
                  content={message.content}
                  className="text-sm leading-relaxed"
                  isStreaming={streamingMessageId === message.id}
                />
              ) : (
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </div>
              )}
              {/* File Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="space-y-2 mt-2">
                  {message.attachments.map((attachment, index) => (
                    <div key={index}>
                      {attachment.type.startsWith("image/") ? (
                        // Display image directly
                        <div className="group relative cursor-pointer">
                          <img
                            src={attachment.url}
                            alt="Attachment"
                            className="hover:opacity-90 rounded-lg max-w-full max-h-64 object-cover transition-opacity"
                          />
                          {attachment.size > 0 && (
                            <span className="bottom-2 left-2 absolute text-xs">
                              {formatFileSize(attachment.size)}
                            </span>
                          )}
                        </div>
                      ) : (
                        // Display file icon for non-images
                        <div
                          className="flex items-center gap-2 bg-[--biqpod-gray-opacity] hover:bg-[--biqpod-gray-opacity-2] p-2 rounded-lg transition-colors cursor-pointer"
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = attachment.url;
                            link.download = attachment.name;
                            link.click();
                          }}
                        >
                          <CircleTip
                            icon={getFileIcon(attachment.type)}
                            className="bg-[--biqpod-primary] w-8 h-8 text-[--biqpod-primary-content]"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="opacity-70 text-xs">
                              {attachment.size > 0
                                ? formatFileSize(attachment.size)
                                : "File"}
                            </div>
                          </div>
                          <CircleTip
                            icon={allIcons.solid.faDownload}
                            className="bg-transparent hover:bg-[--biqpod-gray-opacity-2] w-6 h-6 text-[--biqpod-text-color]"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {/* Message timestamp */}
              <div
                className={tw(
                  "text-xs opacity-70 mt-1",
                  message.sender === "user"
                    ? "text-[--biqpod-primary-content]"
                    : "text-[--biqpod-text-color]"
                )}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              {/* Message Actions */}
              <div
                className={tw(
                  "absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-1 bg-[--biqpod-gray-opacity] rounded-lg p-1 shadow-xl border border-[--biqpod-borders]",
                  message.sender === "user" ? "right-0" : "left-0"
                )}
              >
                <Tip
                  icon={allIcons.regular.faCopy}
                  className="hover:bg-[--biqpod-gray-opacity-2] w-6 h-6 text-[--biqpod-text-color] text-xs transition-colors"
                  onClick={() => {
                    navigator.clipboard.writeText(message.content);
                    showToast("Message copied!", "success");
                  }}
                />
                {message.sender === "ai" && (
                  <>
                    <Tip
                      icon={allIcons.solid.faThumbsUp}
                      className="hover:bg-[--biqpod-success] w-6 h-6 text-[--biqpod-text-color] text-xs transition-colors"
                    />
                    <Tip
                      icon={allIcons.solid.faThumbsDown}
                      className="hover:bg-[--biqpod-error] w-6 h-6 text-[--biqpod-text-color] text-xs transition-colors"
                    />
                    <Tip
                      icon={allIcons.solid.faDownload}
                      className="hover:bg-[--biqpod-primary] w-6 h-6 text-[--biqpod-text-color] text-xs transition-colors"
                    />
                    <Tip
                      icon={allIcons.solid.faRefresh}
                      className="hover:bg-[--biqpod-warning] w-6 h-6 text-[--biqpod-text-color] text-xs transition-colors"
                    />
                    <Tip
                      icon={allIcons.solid.faEllipsis}
                      className="hover:bg-[--biqpod-gray-opacity-2] w-6 h-6 text-[--biqpod-text-color] text-xs transition-colors"
                    />
                  </>
                )}
              </div>
            </Card>
            {/* User Avatar */}
            {message.sender === "user" && <UserAvatar user={user} />}
          </motion.div>
        ))}

        {/* AI Typing Indicator */}
        <div ref={messagesEndRef} />
      </motion.div>
      {/* Scroll to bottom button */}
      <Line />
      {/* Input Area */}
      <motion.div
        className="relative bg-[--biqpod-secondary-background] p-4 border-[--biqpod-borders] border-t"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="bottom-full left-1/2 absolute p-3 -translate-x-1/2 transform">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <CircleTip
              icon={allIcons.solid.faArrowDown}
              className="bg-[--biqpod-gray-opacity] hover:bg-[--biqpod-gray-opacity-2] text-[--biqpod-text-color]"
              onClick={scrollToBottom}
            />
          </motion.div>
        </div>
        {/* File Previews */}
        {selectedFiles.length > 0 && (
          <motion.div
            className="bg-[--biqpod-gray-opacity] mb-3 p-2 rounded-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-[--biqpod-text-color] text-sm">
                Attachments ({selectedFiles.length})
              </span>
              <Tip
                icon={allIcons.solid.faXmark}
                className="w-5 h-5 text-[--biqpod-text-color]"
                onClick={() => setSelectedFiles([])}
              />
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              <AnimatePresence>
                {selectedFiles.map((file, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    {file.type.startsWith("image/") ? (
                      // Show image preview
                      <div className="relative bg-[--biqpod-primary-background] p-2 rounded">
                        <div className="flex items-center gap-2">
                          <img
                            src={file.url}
                            alt="Preview"
                            className="rounded w-12 h-12 object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="opacity-70 text-xs">
                              Image •{" "}
                              {file.size > 0
                                ? formatFileSize(file.size)
                                : "File"}
                            </div>
                          </div>
                          <Tip
                            icon={allIcons.solid.faXmark}
                            className="w-5 h-5"
                            onClick={() => {
                              setSelectedFiles((prev) =>
                                prev.filter((_, i) => i !== index)
                              );
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      // Show file icon for non-images
                      <div className="flex items-center gap-2 bg-[--biqpod-primary-background] p-2 rounded text-sm">
                        <Icon icon={getFileIcon(file.type)} />
                        <div className="flex-1 min-w-0">
                          <div className="opacity-70 text-xs">
                            {file.size > 0 ? formatFileSize(file.size) : "File"}
                          </div>
                        </div>
                        <Tip
                          icon={allIcons.solid.faXmark}
                          className="w-5 h-5 text-[--biqpod-text-color]"
                          onClick={() => {
                            setSelectedFiles((prev) =>
                              prev.filter((_, i) => i !== index)
                            );
                          }}
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
        <motion.div
          className="flex items-end gap-3 mx-auto max-w-4xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {/* Attachment Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <CircleTip
              icon={allIcons.solid.faPaperclip}
              onClick={handleFileSelect}
            />
          </motion.div>
          {/* Input Field Container */}
          <motion.div
            className="relative flex-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <Field
              inputName="chat-input"
              className="rounded-2xl"
              placeholder="Ask anything"
              multiLines={true}
              rows={1}
            />
            {/* Voice Button inside input */}
          </motion.div>
          {/* Send Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <CircleTip
              icon={
                inputValue.trim() || selectedFiles.length > 0
                  ? allIcons.solid.faPaperPlane
                  : allIcons.solid.faArrowUp
              }
              onClick={async () => {
                if (inputValue.trim() || selectedFiles.length > 0) {
                  const messageContent =
                    inputValue.trim() ||
                    (selectedFiles.length > 0 ? "📎 File attachments" : "");

                  const newMessage: Message = {
                    id: Date.now().toString(),
                    content: messageContent,
                    sender: "user",
                    timestamp: new Date(),
                    attachments:
                      selectedFiles.length > 0 ? [...selectedFiles] : undefined,
                  };

                  setMessages((prev) => [...prev, newMessage]);
                  setFieldValue("chat-input", "");
                  // Store files for AI processing before clearing
                  const attachmentsForAI =
                    selectedFiles.length > 0 ? [...selectedFiles] : undefined;
                  setSelectedFiles([]);

                  // Send to AI service
                  await sendToAI(messageContent, attachmentsForAI);
                }
              }}
            />
          </motion.div>
        </motion.div>
        {/* Quick Actions */}
      </motion.div>
    </motion.div>
  );
};
