import { type GenericMessage } from "./ILlmService";

export interface IMessageHistory {
    AddMessage(message: GenericMessage): void;
    GetMessages(): GenericMessage[];
    Clear(): void;
}
