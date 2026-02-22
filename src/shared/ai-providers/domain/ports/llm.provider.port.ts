import {
	InteractionContext,
	InteractionResult,
} from '../../../types/interaction';

export interface LLMProviderPort {
	generateCompletion<T>(
		context: InteractionContext<T>
	): Promise<InteractionResult<T>>;
}
