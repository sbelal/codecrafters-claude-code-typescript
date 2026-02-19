import OpenAI from "openai";
import type { ChatCompletionTool } from "openai/resources";
import { readFileTool } from "./tools/readFile";
import { LlmServiceOpenAI } from "./services/LlmServiceOpenAi";

async function main() {
  const [, , flag, prompt] = process.argv;
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseURL =
    process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }
  if (flag !== "-p" || !prompt) {
    throw new Error("error: -p flag is required");
  }

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
  });

  const llmService = new LlmServiceOpenAI(apiKey, baseURL, "anthropic/claude-haiku-4.5", [readFileTool])

  const response = await llmService.SendMessage(prompt)

  const toolResults = await llmService.ProcessToolCalls(response)
  toolResults.map((toolResult)=>console.log(toolResult.result)) 

  // You can use print statements as follows for debugging, they'll be visible when running tests.
  //console.error("Logs from your program will appear here!");


}

main();
