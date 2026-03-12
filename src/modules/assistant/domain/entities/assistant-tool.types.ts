export interface AssistantToolDefinition {
	name: string;
	description: string;
	parameters: Record<string, unknown>;
}

export interface AssistantToolCall {
	name: string;
	arguments: Record<string, unknown>;
}

export interface AssistantModelAnswer {
	answer: string;
	toolCall?: AssistantToolCall;
}
