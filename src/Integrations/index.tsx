import {
  ArrayField,
  Button,
  Card,
  EnumField,
  Translate,
} from "@biqpod/app/ui/components";
import {
  confirm,
  showToast,
  useCopyState,
  useSettingValue,
} from "@biqpod/app/ui/hooks";
import { Nothing } from "@biqpod/app/ui/types";
import { useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vscDarkPlus,
  vs,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { snapbuyApi } from "../apis";
import { useParams } from "react-router-dom";
import { allIcons } from "@biqpod/app/ui/apis";
export const Integrations = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const origins = useCopyState<string[] | Nothing>([]);
  const apiToken = useCopyState<string | null>(null);
  const isGenerating = useCopyState(false);
  const isLoading = useCopyState(false);
  const error = useCopyState<string | null>(null);
  const selectedLanguage = useCopyState<string | Nothing>("javascript");
  // Detect current theme mode
  const isDarkMode = useSettingValue("window/dark.boolean");
  // Load existing token on component mount
  useEffect(() => {
    const loadExistingToken = async () => {
      if (!storeId) return;
      isLoading.set(true);
      error.set(null);
      try {
        const existingToken = await snapbuyApi.getPartOfToken(storeId);
        if (existingToken) {
          apiToken.set(existingToken);
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
fetch('https://api.snapbuy.com/v1/endpoint', {
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
response = requests.get('https://api.snapbuy.com/v1/endpoint', headers=headers)
data = response.json()
print(data)`,
      php: `<?php
// Using cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://api.snapbuy.com/v1/endpoint');
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
    .uri(URI.create("https://api.snapbuy.com/v1/endpoint"))
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
var response = await client.GetAsync("https://api.snapbuy.com/v1/endpoint");
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
    req, _ := http.NewRequest("GET", "https://api.snapbuy.com/v1/endpoint", nil)
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
uri = URI('https://api.snapbuy.com/v1/endpoint')
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = true
request = Net::HTTP::Get.new(uri)
request['Authorization'] = 'Bearer ${token}'
request['Content-Type'] = 'application/json'
response = http.request(request)
data = JSON.parse(response.body)
puts data`,
      curl: `# Using cURL command line
curl -X GET "https://api.snapbuy.com/v1/endpoint" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json"`,
    };
    return examples[language as keyof typeof examples] || examples.javascript;
  };
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
        apiToken.set(partOfToken);
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
  // Function to regenerate token
  const regenerateToken = async () => {
    const response = await confirm({
      title: "Regenerate API Token",
      message: "Are you sure you want to regenerate the API token?",
      type: "warning",
    });
    if (response) {
      await generateToken();
    }
  };
  // Function to add origin to the list
  // Function to copy token to clipboard
  const copyToken = async () => {
    if (apiToken.get) {
      try {
        await navigator.clipboard.writeText(apiToken.get);
        showToast("API Token copied to clipboard");
        // Clear any existing errors when copy is successful
        error.set(null);
        // You could add a toast notification here
      } catch (err) {
        error.set("Failed to copy token to clipboard");
      }
    }
  };
  return (
    <div className="space-y-6 p-6">
      <div className="mb-8">
        <h1 className="mb-2 font-bold text-[--biqpod-text-color] text-2xl">
          <Translate content="API Integrations" />
        </h1>
        <p className="opacity-70 text-[--biqpod-text-color]">
          <Translate content="Configure your SnapBuy API integration settings" />
        </p>
      </div>
      {/* SnapBuy API Integration Section */}
      <Card className="p-6">
        <h2 className="mb-4 font-semibold text-[--biqpod-text-color] text-xl">
          <Translate content="SnapBuy API Integration" />
        </h2>
        {/* API Token Section */}
        <div className="mb-6">
          <h3 className="mb-3 font-medium text-[--biqpod-text-color] text-lg">
            <Translate content="API Token" />
          </h3>
          {/* Error Display */}
          {error.get && (
            <div className="bg-red-100 mb-3 px-4 py-3 border border-red-300 rounded-lg text-red-700">
              <p className="text-sm">{error.get}</p>
            </div>
          )}
          {!storeId ? (
            <div className="bg-[--biqpod-gray-opacity] p-4 rounded-lg">
              <p className="opacity-70 text-[--biqpod-text-color]">
                <Translate content="Store ID is required to generate API tokens. Please make sure you're accessing this from a store context." />
              </p>
            </div>
          ) : apiToken.get ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-[--biqpod-gray-opacity] p-3 rounded-lg font-mono text-sm">
                  {apiToken.get}
                </div>
                <Button
                  onClick={copyToken}
                  className="bg-[--biqpod-gray-opacity] px-4 py-2 w-fit text-[--biqpod-text-color]"
                  icon={allIcons.regular.faCopy}
                >
                  <Translate content="Copy" />
                </Button>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={regenerateToken}
                  disabled={isGenerating.get}
                  className="px-4 py-2"
                >
                  <Translate
                    content={
                      isGenerating.get ? "Regenerating..." : "Regenerate Token"
                    }
                  />
                </Button>
                {apiToken.get.startsWith("sb_demo_") && (
                  <span className="bg-yellow-100 px-3 py-2 rounded-lg text-yellow-800 text-xs">
                    <Translate content="Demo Token" />
                  </span>
                )}
              </div>
            </div>
          ) : (
            <Button
              onClick={generateToken}
              disabled={isGenerating.get || isLoading.get}
              className="px-6 py-2"
            >
              <Translate
                content={
                  isGenerating.get
                    ? "Generating..."
                    : isLoading.get
                    ? "Loading..."
                    : "Generate API Token"
                }
              />
            </Button>
          )}
        </div>
        {/* Origins Section */}
        <ArrayField
          state={origins}
          id="origins"
          config={{
            addText: "Add Origin",
          }}
        />
        {/* API Usage Instructions */}
        {apiToken.get && (
          <div className="bg-[--biqpod-field-background] mt-6 p-4 border border-[--biqpod-borders] border-solid rounded-lg">
            <h4 className="mb-4 font-medium text-[--biqpod-text-color] text-sm">
              <Translate content="Usage Instructions" />
            </h4>
            {/* Programming Language Selector */}
            <div className="mb-4">
              <label className="block mb-2 font-medium text-[--biqpod-text-color] text-sm">
                <Translate content="Choose Programming Language:" />
              </label>
              <EnumField
                state={selectedLanguage}
                id="programming-language"
                config={{
                  list: languageOptions,
                }}
              />
            </div>
            {/* Code Example */}
            <div>
              <p className="opacity-70 mb-2 text-[--biqpod-text-color] text-xs">
                <Translate content="Code example for" />{" "}
                {
                  languageOptions.find(
                    (lang) => lang.value === selectedLanguage.get
                  )?.content
                }
                :
              </p>
              <div className="rounded-lg overflow-hidden">
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
                    apiToken.get || ""
                  )}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
