import { GeneratedTextOutput } from '../../domain/entities/generate-text.types';

export class GeneratedTextResponseDto {
	generatedText: string;

	private constructor(props: GeneratedTextResponseDto) {
		Object.assign(this, props);
	}

	static fromDomain(
		generatedText: GeneratedTextOutput,
	): GeneratedTextResponseDto {
		return new GeneratedTextResponseDto({
			generatedText: generatedText.text,
		});
	}
}
