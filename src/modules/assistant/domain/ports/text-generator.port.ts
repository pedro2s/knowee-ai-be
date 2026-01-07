import { InteractionContext } from 'src/shared/domain/types/interaction';
import {
	GeneratedTextOutput,
	GenerateTextInput,
} from '../entities/generate-text.types';

export interface TextGeneratorPort {
	generate(
		context: InteractionContext<GenerateTextInput>,
	): Promise<GeneratedTextOutput>;
}
