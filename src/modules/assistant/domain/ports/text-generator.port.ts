import { ConversationContext } from 'src/shared/domain/types/conversation-context';
import {
	GeneratedTextOutput,
	GenerateTextInput,
} from '../entities/generate-text.types';

export interface TextGeneratorPort {
	generate(input: GenerateTextInput): Promise<GeneratedTextOutput>;
}
