import { ConversationContext } from 'src/shared/domain/types/conversation-context';

export interface GenerateTextInput {
	prompt: string;
	context?: ConversationContext;
}

export interface GeneratedTextOutput {
	text: string;
}
