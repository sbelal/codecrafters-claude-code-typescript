/** * Use 'type' for the JSON Schema because it is a complex 
 * union of possible data types and structures.
 */
export type ToolParameterSchema = {
    type: 'object';
    properties: Record<string, {
        type: 'string' | 'number' | 'boolean' | 'integer' | 'array' | 'object';
        description: string;
        enum?: string[];
    }>;
    required?: string[];
};

/**
 * Use 'interface' for the Tool itself. 
 * This is the blueprint for your abstraction layer.
 */
export interface Tool {
    name: string;
    description: string;
    parameters: ToolParameterSchema;
    // Generic execution logic
    execute: (args: any) => Promise<any>;
}

export interface ToolExecutionResult {
    id: string
    toolName: string;
    success: boolean;
    result?: any; // The result of the tool execution    
}

class ToolRegistryRepo {
    private toolRegistry: Record<string, Tool> = {};

    public RegisterTool(toolDef: Tool) {
        this.toolRegistry[toolDef.name] = toolDef;
    }

    public GetAllTools(): Tool[] {
        return Object.values(this.toolRegistry);
    }

    public async ExecuteTool(name: string, id: string, args: any): Promise<ToolExecutionResult> {
        const tool = this.toolRegistry[name];
        if (!tool) {
            throw new Error(`Tool ${name} not found`);
        }

        let success = false
        let toolResultRaw;
        try {
            toolResultRaw = await tool.execute(args);
            success = true
        } catch (error) {
            toolResultRaw = error instanceof Error ? error.message : 'Unknown error';
        }

        const toolResult: ToolExecutionResult = {
            id: id,
            success: success,
            toolName: tool.name,
            result: toolResultRaw,
        }

        return toolResult
    }

}

export const ToolRegistry = new ToolRegistryRepo();