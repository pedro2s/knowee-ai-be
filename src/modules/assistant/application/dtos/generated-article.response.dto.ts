import { GeneratedArticleOutput } from '../../domain/entities/generate-article.types';

export class GeneratedArticleResponseDto {
	content: string;

	private constructor(props: GeneratedArticleResponseDto) {
		Object.assign(this, props);
	}

	static fromDomain(
		generatedArticle: GeneratedArticleOutput
	): GeneratedArticleResponseDto {
		return new GeneratedArticleResponseDto({
			content: generatedArticle.content,
		});
	}
}
