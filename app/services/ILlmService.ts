import { ToolRegistry, type Tool, type ToolExecutionResult } from "../repos/ToolRegistryRepo";


export interface GenericResponse {
    id: string;
    role: 'assistant';
    content: string | null;
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
    SendMessage(prompt: string): Promise<GenericResponse>;
}

export abstract class BaseLlmService implements ILlmService {

    protected tools?: Tool[]

    constructor(tools?: Tool[]) {
        this.tools = tools ? tools : undefined
    }


    public SendMessage(prompt: string): Promise<GenericResponse> {
        throw new Error("Method not implemented.");
    }

    public async ProcessToolCalls(response: GenericResponse): Promise<ToolExecutionResult[]> {

        const toolResponses = await Promise.all(
            response.toolCalls?.map(
                (tool) => ToolRegistry.ExecuteTool(tool.name, tool.id, tool.arguments)
            ) || []
        );

        return toolResponses
    }

}
