import { ToolRegistry, type Tool } from "../repos/ToolRegistryRepo";
import { promises as fs } from "fs";

const writeFile: Tool = {
    name: "Write",
    description: "Write content to a file, creating it if it doesn't exist",
    parameters: {
        type: "object",
        properties: {
            filePath: { type: "string", description: "The path to the file to write" },
            content: { type: "string", description: "The content to write to the file" }
        },
        required: ["filePath", "content"]
    },
    execute: async ({ filePath, content }) => {
        try {
            await fs.writeFile(filePath, content, 'utf-8');
            return `Successfully wrote to ${filePath}`;
        } catch (error) {
            throw new Error(`Error writing file: ${(error as Error).message}`);
        }
    }
};

ToolRegistry.RegisterTool(writeFile);

export const writeFileTool = writeFile;
