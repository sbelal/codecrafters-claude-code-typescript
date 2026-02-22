import { ToolRegistry, type Tool } from "../repos/ToolRegistryRepo";
import { exec } from "child_process";

const bash: Tool = {
    name: "Bash",
    description: "Execute a shell command and return its output",
    parameters: {
        type: "object",
        properties: {
            command: { type: "string", description: "The shell command to execute" }
        },
        required: ["command"]
    },
    execute: async ({ command }) => {
        return new Promise((resolve, reject) => {
            exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Command failed: ${stderr || error.message}`));
                    return;
                }
                resolve(stdout || stderr);
            });
        });
    }
};

ToolRegistry.RegisterTool(bash);

export const bashTool = bash;
