import OpenAI from "openai";
import type { ChatCompletion, ChatCompletionMessageFunctionToolCall, ChatCompletionTool } from "openai/resources";
import type { Tool } from "../repos/ToolRegistryRepo";
import { BaseLlmService, type GenericResponse, type ILlmService } from "./ILlmService";


export class LlmServiceOpenAI extends BaseLlmService {
    private client: OpenAI;
    private model: string;    
    private openAiTools?: ChatCompletionTool[]

    constructor(apiKey?: string, baseUrl?: string, model?: string, tools?: Tool[]) {
        super(tools);
        this.model = model ? model : "anthropic/claude-haiku-4.5"        
        this.openAiTools = this.tools?.map((tool) => this.mapToOpenAiTool(tool))
        this.client = new OpenAI({
            apiKey: apiKey,
            baseURL: baseUrl,
        });
    }


    private mapToOpenAiTool(tool: Tool): ChatCompletionTool {
        return {
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: {
                    ...tool.parameters,
                    additionalProperties: false,
                    required: Object.keys(tool.parameters.properties),
                }, // JSON Schema is compatible
                // Note: OpenAI 'strict' mode can be enabled here if desired
                strict: true
            }
        };
    }

    private mapOpenAiResponseToGenericResponse(response: ChatCompletion): GenericResponse {
        const choice = response.choices[0].message;

        return {
            id: response.id,
            role: 'assistant',
            content: choice.content,
            // Map OpenAI tool_calls to our cleaner format
            toolCalls: choice.tool_calls
                ?.filter((tc): tc is ChatCompletionMessageFunctionToolCall => tc.type === 'function')
                .map((tc) => ({
                    id: tc.id,
                    name: tc.function.name,
                    arguments: JSON.parse(tc.function.arguments), // Parsing here saves work later
                })),
            usage: {
                promptTokens: response.usage?.prompt_tokens ?? 0,
                completionTokens: response.usage?.completion_tokens ?? 0,
                totalTokens: response.usage?.total_tokens ?? 0,
            },
            raw: response,
        };
    }

    public async SendMessage(prompt: string): Promise<GenericResponse> {
        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [{ role: "user", content: prompt }],
            tools: this.openAiTools
        });

        const genResponse = this.mapOpenAiResponseToGenericResponse(response)
        return genResponse
    }


}