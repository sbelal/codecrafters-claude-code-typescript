import { ToolRegistry, type ToolExecutionResult } from "../repos/ToolRegistryRepo";
import type { GenericResponse } from "./ILlmService";

export class ToolService {
    public async ProcessToolCalls(response: GenericResponse): Promise<ToolExecutionResult[]> {
        const toolResponses = await Promise.all(
            response.toolCalls?.map(
                (tool) => ToolRegistry.ExecuteTool(tool.name, tool.id, tool.arguments)
            ) || []
        );

        return toolResponses;
    }
}
