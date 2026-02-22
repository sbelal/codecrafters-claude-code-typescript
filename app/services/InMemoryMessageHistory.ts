import { type GenericMessage } from "./ILlmService";
import { type IMessageHistory } from "./IMessageHistory";

export class InMemoryMessageHistory implements IMessageHistory {
    private messages: GenericMessage[] = [];

    public AddMessage(message: GenericMessage): void {
        this.messages.push(message);
    }

    public GetMessages(): GenericMessage[] {
        return [...this.messages];
    }

    public Clear(): void {
        this.messages = [];
    }
}
