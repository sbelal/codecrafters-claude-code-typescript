import type { Tool } from "../repos/ToolRegistryRepo";
import { InMemoryMessageHistory } from "./InMemoryMessageHistory";


export interface GenericMessage {
    role: 'user' | 'assistant' | 'tool';
    content: string | null;
    toolCalls?: Array<{
        id: string;
        name: string;
        arguments: any;
    }>;
    toolCallId?: string; // For single tool result (role: 'tool')
    toolResults?: Array<{  // For batched tool results (role: 'tool')
        toolCallId: string;
        content: string;
    }>;
}

export interface GenericResponse {
    id: string;
    role: 'assistant';
    content: string | null;
    finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter';
    toolCalls?: Array<{
        id: string;
        name: string;
        arguments: any; // Parsed JSON object
    }>;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    raw: any; // Keep the original response for provider-specific debugging
}


export interface ILlmService {
    SendMessage(message: GenericMessage): Promise<GenericResponse>;
}

export abstract class BaseLlmService implements ILlmService {

    protected tools?: Tool[]
    protected history: InMemoryMessageHistory = new InMemoryMessageHistory();

    constructor(tools?: Tool[]) {
        this.tools = tools ? tools : undefined
    }

    public abstract SendMessage(message: GenericMessage): Promise<GenericResponse>;

}
