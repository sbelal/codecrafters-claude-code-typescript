import OpenAI from "openai";
import type { ChatCompletion, ChatCompletionMessageFunctionToolCall, ChatCompletionTool, ChatCompletionMessageParam } from "openai/resources";
import type { Tool } from "../repos/ToolRegistryRepo";
import { BaseLlmService, type GenericResponse, type GenericMessage } from "./ILlmService";


export class LlmServiceOpenAI extends BaseLlmService {
    private client: OpenAI;
    private model: string;
    private openAiTools?: ChatCompletionTool[]
    private openAiMessages: ChatCompletionMessageParam[] = [];

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
        const choice = response.choices[0];

        return {
            id: response.id,
            role: 'assistant',
            content: choice.message.content,
            finishReason: choice.finish_reason as GenericResponse['finishReason'],
            // Map OpenAI tool_calls to our cleaner format
            toolCalls: choice.message.tool_calls
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

    private mapGenericMessageToOpenAi(message: GenericMessage): ChatCompletionMessageParam[] {
        if (message.role === 'user') {
            return [{ role: 'user', content: message.content ?? '' }];
        } else if (message.role === 'assistant') {
            return [{
                role: 'assistant',
                content: message.content,
                tool_calls: message.toolCalls?.map(tc => ({
                    id: tc.id,
                    type: 'function' as const,
                    function: {
                        name: tc.name,
                        arguments: JSON.stringify(tc.arguments)
                    }
                }))
            }];
        } else if (message.role === 'tool') {
            // Batched tool results
            if (message.toolResults) {
                return message.toolResults.map(tr => ({
                    role: 'tool' as const,
                    tool_call_id: tr.toolCallId,
                    content: tr.content
                }));
            }
            // Single tool result
            return [{
                role: 'tool',
                tool_call_id: message.toolCallId!,
                content: message.content ?? ''
            }];
        }
        throw new Error(`Unsupported role: ${message.role}`);
    }

    private genericResponseToGenericMessage(response: GenericResponse): GenericMessage {
        return {
            role: 'assistant',
            content: response.content,
            toolCalls: response.toolCalls
        };
    }

    /**
     * Dual-writes a GenericMessage to both the InMemoryMessageHistory and the
     * internal OpenAI-specific ChatCompletionMessageParam array.
     */
    private dualWrite(message: GenericMessage): void {
        this.history.AddMessage(message);
        this.openAiMessages.push(...this.mapGenericMessageToOpenAi(message));
    }

    /**
     * Sends a single message to the LLM. The message is added to both history
     * stores before sending. The assistant response is also dual-written.
     */
    public async SendMessage(message: GenericMessage): Promise<GenericResponse> {
        // Dual-write incoming message
        this.dualWrite(message);

        // Send accumulated history to the LLM
        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: this.openAiMessages,
            tools: this.openAiTools?.length ? this.openAiTools : undefined
        });

        const genResponse = this.mapOpenAiResponseToGenericResponse(response);

        // Dual-write assistant response
        this.dualWrite(this.genericResponseToGenericMessage(genResponse));

        return genResponse;
    }

}