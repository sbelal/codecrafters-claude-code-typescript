import { readFileTool } from "./tools/readFile";
import { writeFileTool } from "./tools/writeFile";
import { LlmServiceOpenAI } from "./services/LlmServiceOpenAi";
import { ToolService } from "./services/ToolService";
import type { Tool } from "./repos/ToolRegistryRepo";

function createLlmService(): LlmServiceOpenAI {
  const provider = process.env.LLM_PROVIDER
    ?? (process.env.OLLAMA_MODEL ? "ollama" : "openrouter");

  let tools: Tool[] = [readFileTool, writeFileTool];
  if (provider === "ollama") {
    const model = process.env.OLLAMA_MODEL ?? "qwen3-coder:30b";
    const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1";
    return new LlmServiceOpenAI("ollama", baseUrl, model, tools);
  }

  // OpenRouter (default)
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }
  const baseUrl = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
  return new LlmServiceOpenAI(apiKey, baseUrl, "anthropic/claude-haiku-4.5", tools);
}

async function main() {
  const [, , flag, prompt] = process.argv;

  if (flag !== "-p" || !prompt) {
    throw new Error("error: -p flag is required");
  }

  const llmService = createLlmService();
  const toolService = new ToolService();

  // 1. Send user message — LLM service handles history internally
  let response = await llmService.SendMessage({ role: 'user', content: prompt });

  // 2. Keep processing until the LLM signals it's done
  while (response.finishReason !== 'stop') {
    if (response.finishReason === 'tool_calls' && response.toolCalls) {
      const toolResults = await toolService.ProcessToolCalls(response);

      // for (const toolResult of toolResults) {
      //   console.log(`Tool ${toolResult.toolName} result: ${typeof toolResult.result === 'string' ? toolResult.result : JSON.stringify(toolResult.result)}`);
      // }

      // Send tool results back to LLM
      response = await llmService.SendMessage({
        role: 'tool',
        content: null,
        toolResults: toolResults.map(tr => ({
          toolCallId: tr.id,
          content: typeof tr.result === 'string' ? tr.result : JSON.stringify(tr.result)
        }))
      });
    } else {
      // Unexpected finish reason (e.g., 'length', 'content_filter')
      console.error(`Unexpected finish reason: ${response.finishReason}`);
      break;
    }
  }

  if (response.content) {
    console.log(response.content);
  }
}

main();
