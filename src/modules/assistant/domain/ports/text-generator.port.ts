import { InteractionContext } from 'src/shared/domain/types/interaction-context';
import {
	GeneratedTextOutput,
	GenerateTextInput,
} from '../entities/generate-text.types';

export interface TextGeneratorPort {
	generate(
		context: InteractionContext<GenerateTextInput>,
	): Promise<GeneratedTextOutput>;
}
