import { GeneratedLessonScript } from '../../domain/entities/lesson-script.types';

export class GeneratedLessonScriptResponseDto {
	scriptSections: Array<{
		id: string;
		content: string;
		isRecorded: boolean;
		status: string;
		notes: string;
		time: number;
		timerActive: boolean;
	}>;

	private constructor(props: GeneratedLessonScriptResponseDto) {
		Object.assign(this, props);
	}

	static fromDomain(
		generatedArticle: GeneratedLessonScript
	): GeneratedLessonScriptResponseDto {
		return new GeneratedLessonScriptResponseDto({
			scriptSections: generatedArticle.scriptSections,
		});
	}
}
