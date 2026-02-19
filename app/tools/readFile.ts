import { ToolRegistry, type Tool } from "../repos/ToolRegistryRepo";
import { promises as fs } from "fs";

const readFile: Tool = {
    name: "Read",
    description: "Read and return the contents of a file",
    parameters: {
        type: "object",
        properties: {
            filePath: { type: "string", description: "The path to the file to read" }
        },
        required: ["filePath"]
    },
    execute: async ({ filePath }) => {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return content;
        } catch (error) {
            throw new Error(`Error reading file: ${(error as Error).message}`);
        }
    }
};

ToolRegistry.RegisterTool(readFile)

export const readFileTool = readFile