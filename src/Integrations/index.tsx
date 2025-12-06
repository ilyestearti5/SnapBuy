import {
  ArrayField,
  Button,
  Card,
  CardHeaderForPopup,
  CircleTip,
  EnumField,
  Icon,
  Line,
  Translate,
} from "@biqpod/app/ui/components";
import {
  showToast,
  useCopyState,
  useSettingValue,
  showPopup,
  openMenu,
} from "@biqpod/app/ui/hooks";
import { Nothing } from "@biqpod/app/ui/types";
import { useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vscDarkPlus,
  vs,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { snapbuyApi } from "../apis";
import { allIcons } from "@biqpod/app/ui/apis";
import { motion, AnimatePresence } from "framer-motion";
import { UpsertAccessUsertoStore } from "./UpsertAccessUsertoStore";
import { UsersAccessListForStore } from "./UsersAccessListForStore";
import { useUsedBy } from "../routes/Stores/Stores";
import { useStoreId } from "../utils";
import {
  containerVariants,
  headerVariants,
  cardVariants,
  errorVariants,
  tokenContainerVariants,
  tokenVariants,
  buttonVariants,
  codeBlockVariants,
} from "../utils/constants";

interface UsageInstructionsProps {
  token: string;
}
const SettingOrigins = ({ token: _ }: UsageInstructionsProps) => {
  const origins = useCopyState<string[] | Nothing>([]);
  return (
    <Card>
      <CardHeaderForPopup title="Allowed Origins" />
      <Line />
      <div className="p-2">
        <div>
          <ArrayField
            state={origins}
            config={{
              controls: {
                "^https?:": {
                  succ: "Valid URL",
                  err: "Must start with http:// or https://",
                },
              },
            }}
            id="allowed-origins"
          />
        </div>
      </div>
      <Line />
      <div className="p-2">
        <Button>
          <Translate content="set" />
        </Button>
      </div>
    </Card>
  );
};
function UsageInstructions({ token }: UsageInstructionsProps) {
  const selectedLanguage = useCopyState<string | Nothing>("javascript");
  // Detect current theme mode
  const isDarkMode = useSettingValue("window/dark.boolean");
  const languageOptions = [
    { value: "javascript", content: "JavaScript" },
    { value: "python", content: "Python" },
    { value: "php", content: "PHP" },
    { value: "java", content: "Java" },
    { value: "csharp", content: "C#" },
    { value: "go", content: "Go" },
    { value: "ruby", content: "Ruby" },
    { value: "curl", content: "Curl" },
  ];
  // Function to get syntax highlighting language
  const getSyntaxLanguage = (language: string) => {
    const languageMap = {
      javascript: "javascript",
      python: "python",
      php: "php",
      java: "java",
      csharp: "csharp",
      go: "go",
      ruby: "ruby",
      curl: "bash",
    };
    return languageMap[language as keyof typeof languageMap] || "javascript";
  };
  // Function to get code example based on selected language
  const getCodeExample = (language: string, token: string) => {
    const examples = {
      javascript: `// Using fetch API
fetch('https://api.biqpod.com/snapbuy/', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ${token}',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));`,
      python: `# Using requests library
import requests
headers = {
    'Authorization': 'Bearer ${token}',
    'Content-Type': 'application/json'
}
response = requests.get('https://api.biqpod.com/snapbuy/', headers=headers)
data = response.json()
print(data)`,
      php: `<?php
// Using cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://api.biqpod.com/snapbuy/');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ${token}',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$data = json_decode($response, true);
curl_close($ch);
?>`,
      java: `// Using HttpURLConnection
import java.net.http.*;
import java.net.URI;
HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.biqpod.com/snapbuy/"))
    .header("Authorization", "Bearer ${token}")
    .header("Content-Type", "application/json")
    .GET()
    .build();
HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
      csharp: `// Using HttpClient
using System.Net.Http;
using System.Net.Http.Headers;
var client = new HttpClient();
client.DefaultRequestHeaders.Authorization = 
    new AuthenticationHeaderValue("Bearer", "${token}");
var response = await client.GetAsync("https://api.biqpod.com/snapbuy/");
var content = await response.Content.ReadAsStringAsync();
Console.WriteLine(content);`,
      go: `// Using net/http package
package main
import (
    "fmt"
    "net/http"
    "io/ioutil"
)
func main() {
    client := &http.Client{}
    req, _ := http.NewRequest("GET", "https://api.biqpod.com/snapbuy/", nil)
    req.Header.Add("Authorization", "Bearer ${token}")
    req.Header.Add("Content-Type", "application/json")
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    body, _ := ioutil.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
      ruby: `# Using net/http
require 'net/http'
require 'json'
uri = URI('https://api.biqpod.com/snapbuy/')
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = true
request = Net::HTTP::Get.new(uri)
request['Authorization'] = 'Bearer ${token}'
request['Content-Type'] = 'application/json'
response = http.request(request)
data = JSON.parse(response.body)
puts data`,
      curl: `# Using cURL command line
curl -X GET "https://api.biqpod.com/snapbuy/" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json"`,
    };
    return examples[language as keyof typeof examples] || examples.javascript;
  };
  return (
    <Card>
      <CardHeaderForPopup title="Usage Instructions" />
      <Line />
      <AnimatePresence>
        <motion.div
          className="p-4 rounded-lg"
          variants={codeBlockVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.h4
            className="font-medium text-[--biqpod-text-color] text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Translate content="" />
          </motion.h4>
          {/* Programming Language Selector */}
          <motion.div
            className="mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.label
              className="block mb-2 font-medium text-[--biqpod-text-color] text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Translate content="Choose Programming Language:" />
            </motion.label>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <EnumField
                state={selectedLanguage}
                id="programming-language"
                config={{
                  list: languageOptions,
                }}
              />
            </motion.div>
          </motion.div>
          {/* Code Example */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.p
              className="opacity-70 mb-2 text-[--biqpod-text-color] text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: 0.6 }}
            >
              <Translate content="Code example for" />{" "}
              {
                languageOptions.find(
                  (lang) => lang.value === selectedLanguage.get
                )?.content
              }
              :
            </motion.p>
            <motion.div
              className="rounded-lg overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                delay: 0.7,
                duration: 0.4,
              }}
            >
              <SyntaxHighlighter
                language={getSyntaxLanguage(
                  selectedLanguage.get || "javascript"
                )}
                style={isDarkMode ? vscDarkPlus : vs}
                showLineNumbers={true}
                wrapLines={true}
                customStyle={{
                  margin: 0,
                  fontSize: "12px",
                  background: isDarkMode
                    ? "rgba(0, 0, 0, 0.3)"
                    : "rgba(255, 255, 255, 0.9)",
                  border: isDarkMode
                    ? "1px solid rgba(255, 255, 255, 0.1)"
                    : "1px solid rgba(0, 0, 0, 0.1)",
                }}
              >
                {getCodeExample(
                  (selectedLanguage.get as string) || "javascript",
                  token || ""
                )}
              </SyntaxHighlighter>
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Card>
  );
}
export const Integrations = () => {
  const storeId = useStoreId();
  const usedBy = useUsedBy();
  const apiTokens = useCopyState<string[] | null>(null);
  const isGenerating = useCopyState(false);
  const isLoading = useCopyState(false);
  const error = useCopyState<string | null>(null);
  // Load existing token on component mount
  useEffect(() => {
    const loadExistingToken = async () => {
      if (!storeId) return;
      isLoading.set(true);
      error.set(null);
      try {
        const existingToken = await snapbuyApi.getPartOfToken(storeId);
        if (existingToken) {
          apiTokens.set(existingToken);
        }
      } catch (err) {
        console.error("Failed to load existing token:", err);
        error.set("Failed to load existing token. You can generate a new one.");
      } finally {
        isLoading.set(false);
      }
    };
    loadExistingToken();
  }, [storeId]);
  // Programming language options
  // Function to generate a real API token using snapbuyApi
  const generateToken = async () => {
    if (!storeId) {
      error.set("Store ID is required for token generation");
      return;
    }
    isGenerating.set(true);
    error.set(null);
    try {
      const partOfToken = await snapbuyApi.generateStoreApiToken(storeId);
      if (partOfToken) {
        apiTokens.set((s) => [...(s || []), partOfToken]);
        error.set(null);
      } else {
        throw new Error("No token received from API");
      }
    } catch (err) {
      console.error("Failed to generate API token:", err);
      error.set(
        "Failed to generate API token. Please try again or contact support."
      );
      // Fallback to demo token if API fails
    } finally {
      isGenerating.set(false);
    }
  };
  // Function to copy token to clipboard
  return usedBy === "owned" ? (
    <motion.div
      className="space-y-6 p-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="mb-8" variants={headerVariants}>
        <motion.h1
          className="mb-2 font-bold text-[--biqpod-text-color] text-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.5,
            delay: 0.1,
          }}
        >
          <Translate content="API Integrations" />
        </motion.h1>
        <motion.p
          className="opacity-70 text-[--biqpod-text-color]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.7, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Translate content="Configure your Snapbuy API integration settings" />
        </motion.p>
      </motion.div>
      {/* Biqpod.Snapbuy API Integration Section */}
      <motion.div variants={cardVariants} whileHover="hover">
        <Card className="p-6">
          <motion.h2
            className="mb-4 font-semibold text-[--biqpod-text-color] text-xl"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Translate content="Snapbuy API Integration" />
          </motion.h2>
          {/* API Token Section */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.h3
              className="mb-3 font-medium text-[--biqpod-text-color] text-lg"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Translate content="API Token" />
            </motion.h3>
            {/* Error Display */}
            <AnimatePresence>
              {error.get && (
                <motion.div
                  className="bg-red-100 mb-3 px-4 py-3 border border-red-300 rounded-lg text-red-700"
                  variants={errorVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <motion.p
                    className="text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    {error.get}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
            {!storeId ? (
              <motion.div
                className="bg-[--biqpod-gray-opacity] p-4 rounded-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <motion.p
                  className="opacity-70 text-[--biqpod-text-color]"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.7, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <Translate content="Store ID is required to generate API tokens. Please make sure you're accessing this from a store context." />
                </motion.p>
              </motion.div>
            ) : (
              apiTokens.get && (
                <AnimatePresence>
                  <div className="bg-[--biqpod-gray-opacity] rounded-xl">
                    {apiTokens.get.map((token) => {
                      return (
                        <motion.div
                          className="space-y-3"
                          variants={tokenContainerVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                        >
                          <motion.div
                            className="flex justify-between items-center gap-3 p-2"
                            variants={tokenVariants}
                          >
                            <motion.div className="flex-1rounded-lg font-mono text-sm">
                              {token}
                            </motion.div>
                            <motion.div
                              className="flex gap-3"
                              variants={tokenVariants}
                            >
                              <CircleTip
                                icon={allIcons.solid.faEllipsisV}
                                onClick={({ clientX, clientY }) => {
                                  openMenu({
                                    x: clientX,
                                    y: clientY,
                                    menu: [
                                      {
                                        label: "Usage Instructions",
                                        defaultIcon: allIcons.solid.faCode,
                                        click() {
                                          showPopup(
                                            <UsageInstructions token={token} />
                                          );
                                        },
                                      },
                                      {
                                        label: "Origins",
                                        defaultIcon: allIcons.solid.faGlobe,
                                        click() {
                                          showPopup(
                                            <SettingOrigins token={token} />
                                          );
                                        },
                                      },
                                      {
                                        label: "Delete Token",
                                        defaultIcon: allIcons.solid.faTrashAlt,
                                        click: async () => {
                                          // delete token
                                          await snapbuyApi.deleteToken(
                                            storeId,
                                            token
                                          );
                                          showToast("Token deleted", "success");
                                          // Remove token from state
                                          apiTokens.set((tokens) =>
                                            tokens
                                              ? tokens.filter(
                                                  (t) => t !== token
                                                )
                                              : []
                                          );
                                        },
                                      },
                                      {
                                        label: "Copy Token",
                                        defaultIcon: allIcons.regular.faCopy,
                                        click() {
                                          navigator.clipboard.writeText(token);
                                          showToast(
                                            "Api Token copied to clipboard",
                                            "success"
                                          );
                                        },
                                      },
                                    ],
                                  });
                                }}
                              />
                            </motion.div>
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </div>
                </AnimatePresence>
              )
            )}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-2"
            >
              <motion.div
                variants={buttonVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  onClick={generateToken}
                  disabled={isGenerating.get}
                  className="px-6 py-2"
                >
                  <Translate
                    content={
                      isGenerating.get ? "Generating..." : "Generate API Token"
                    }
                  />
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </Card>
      </motion.div>
      {/* User Access Management Section */}
      {storeId && (
        <motion.div variants={cardVariants} whileHover="hover">
          <Card className="p-6">
            <motion.h2
              className="mb-4 font-semibold text-[--biqpod-text-color] text-xl"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Translate content="Store Access Management" />
            </motion.h2>
            {/* Add User Button */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                className="flex justify-between items-center mb-4"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div>
                  <h3 className="font-medium text-[--biqpod-text-color] text-lg">
                    <Translate content="Manage User Access" />
                  </h3>
                  <p className="opacity-70 mt-1 text-[--biqpod-text-color] text-sm">
                    <Translate content="Invite users to collaborate on your store with different permission levels" />
                  </p>
                </div>
                <motion.div
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    onClick={() =>
                      showPopup(
                        <UpsertAccessUsertoStore
                          storeId={storeId}
                          onSuccess={() => {
                            // This will trigger a refresh in the UsersAccessListForStore component
                          }}
                        />,
                        { type: "blur" }
                      )
                    }
                    className="px-4 py-2"
                    icon={allIcons.solid.faUserPlus}
                  >
                    <Translate content="Invite User" />
                  </Button>
                </motion.div>
              </motion.div>
              {/* Users List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <UsersAccessListForStore storeId={storeId} />
              </motion.div>
            </motion.div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  ) : (
    <motion.div
      className="flex justify-center items-center h-full min-h-[400px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="text-center"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.5,
            delay: 0.3,
          }}
        >
          <Icon
            icon={allIcons.solid.faLock}
            className="mb-4 text-[--biqpod-gray-opacity] text-4xl"
          />
        </motion.div>
        <motion.p
          className="text-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Translate content="Access Restricted" />
        </motion.p>
        <motion.p
          className="text-[--biqpod-gray-opacity-2] mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Translate content="You don't have permission to access integrations" />
        </motion.p>
      </motion.div>
    </motion.div>
  );
};
