import test, { describe } from "node:test";
import assert from "node:assert";
import { LlmServiceOpenAI } from "./LlmServiceOpenAi.js";
import { type GenericMessage } from "./ILlmService.js";

describe("LlmServiceOpenAI Mapping Logic", () => {
    const service = new LlmServiceOpenAI("fake-key", "https://fake-url", "gpt-4");

    test("maps user message correctly", () => {
        const msg: GenericMessage = { role: 'user', content: 'hello' };
        const mapped = (service as any).mapGenericMessageToOpenAi(msg);
        assert.deepStrictEqual(mapped, [{ role: 'user', content: 'hello' }]);
    });

    test("maps assistant message without tool calls", () => {
        const msg: GenericMessage = { role: 'assistant', content: 'hello back' };
        const mapped = (service as any).mapGenericMessageToOpenAi(msg);
        assert.deepStrictEqual(mapped, [{ role: 'assistant', content: 'hello back', tool_calls: undefined }]);
    });

    test("maps assistant message with tool calls", () => {
        const msg: GenericMessage = {
            role: 'assistant',
            content: null,
            toolCalls: [{ id: 'call_1', name: 'my_tool', arguments: { arg1: 'val1' } }]
        };
        const mapped = (service as any).mapGenericMessageToOpenAi(msg);
        assert.deepStrictEqual(mapped, [{
            role: 'assistant',
            content: null,
            tool_calls: [{
                id: 'call_1',
                type: 'function',
                function: {
                    name: 'my_tool',
                    arguments: '{"arg1":"val1"}'
                }
            }]
        }]);
    });

    test("maps single tool result message correctly", () => {
        const msg: GenericMessage = { role: 'tool', content: '{"result":"ok"}', toolCallId: 'call_1' };
        const mapped = (service as any).mapGenericMessageToOpenAi(msg);
        assert.deepStrictEqual(mapped, [{
            role: 'tool',
            tool_call_id: 'call_1',
            content: '{"result":"ok"}'
        }]);
    });

    test("maps batched tool results correctly", () => {
        const msg: GenericMessage = {
            role: 'tool',
            content: null,
            toolResults: [
                { toolCallId: 'call_1', content: '{"result":"ok"}' },
                { toolCallId: 'call_2', content: '{"result":"done"}' }
            ]
        };
        const mapped = (service as any).mapGenericMessageToOpenAi(msg);
        assert.deepStrictEqual(mapped, [
            { role: 'tool', tool_call_id: 'call_1', content: '{"result":"ok"}' },
            { role: 'tool', tool_call_id: 'call_2', content: '{"result":"done"}' }
        ]);
    });
});

