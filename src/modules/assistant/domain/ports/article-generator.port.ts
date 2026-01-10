import {
	InteractionContext,
	InteractionResult,
} from 'src/shared/domain/types/interaction';
import {
	GenerateArticleInput,
	GeneratedArticleOutput,
} from '../entities/generate-article.types';

export interface ArticleGeneratorPort {
	generate(
		context: InteractionContext<GenerateArticleInput>
	): Promise<InteractionResult<GeneratedArticleOutput>>;
}
