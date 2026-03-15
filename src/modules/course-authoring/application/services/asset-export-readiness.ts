export type AssetBlockingIssueCode =
	| 'lesson_not_found'
	| 'video_script_missing'
	| 'video_final_missing'
	| 'audio_script_missing'
	| 'audio_file_missing'
	| 'article_content_missing'
	| 'quiz_questions_missing'
	| 'pdf_missing'
	| 'external_url_missing'
	| 'unsupported_lesson_type'
	| 'generation_failed';

export interface AssetBlockingIssue {
	lessonId: string;
	lessonType: string;
	code: AssetBlockingIssueCode;
	message: string;
}

export type LessonReadiness = 'ready' | 'blocked';

export interface LessonExportReadiness {
	isReady: boolean;
	readiness: LessonReadiness;
	blockingIssues: AssetBlockingIssue[];
}

export interface LessonReadinessInput {
	lessonId: string;
	lessonType: string;
	content: unknown;
}

export function getSafeLessonContent(
	content: unknown
): Record<string, unknown> {
	if (content && typeof content === 'object' && !Array.isArray(content)) {
		return content as Record<string, unknown>;
	}

	return {};
}

export function buildBlockingIssue(input: {
	lessonId: string;
	lessonType: string;
	code: AssetBlockingIssueCode;
	message: string;
}): AssetBlockingIssue {
	return {
		lessonId: input.lessonId,
		lessonType: input.lessonType,
		code: input.code,
		message: input.message,
	};
}

export function evaluateLessonExportReadiness(
	input: LessonReadinessInput
): LessonExportReadiness {
	const content = getSafeLessonContent(input.content);
	const issueBase = {
		lessonId: input.lessonId,
		lessonType: input.lessonType,
	};

	if (input.lessonType === 'video') {
		const scriptSections = Array.isArray(content.scriptSections)
			? content.scriptSections
			: [];

		if (scriptSections.length === 0) {
			return blocked([
				buildBlockingIssue({
					...issueBase,
					code: 'video_script_missing',
					message: 'A aula de video nao possui roteiro gerado.',
				}),
			]);
		}

		if (!getNonEmptyString(content.finalVideoPath)) {
			return blocked([
				buildBlockingIssue({
					...issueBase,
					code: 'video_final_missing',
					message:
						'A aula de video nao possui video final pronto para exportacao.',
				}),
			]);
		}

		return ready();
	}

	if (input.lessonType === 'audio') {
		const scriptSections = Array.isArray(content.scriptSections)
			? content.scriptSections
			: [];

		if (scriptSections.length === 0) {
			return blocked([
				buildBlockingIssue({
					...issueBase,
					code: 'audio_script_missing',
					message: 'A aula de audio nao possui roteiro gerado.',
				}),
			]);
		}

		if (!getNonEmptyString(content.audioPath)) {
			return blocked([
				buildBlockingIssue({
					...issueBase,
					code: 'audio_file_missing',
					message:
						'A aula de audio nao possui narracao pronta para exportacao.',
				}),
			]);
		}

		return ready();
	}

	if (input.lessonType === 'article') {
		if (!getNonEmptyString(content.articleContent)) {
			return blocked([
				buildBlockingIssue({
					...issueBase,
					code: 'article_content_missing',
					message: 'A aula de artigo nao possui conteudo gerado.',
				}),
			]);
		}

		return ready();
	}

	if (input.lessonType === 'quiz') {
		const quizQuestions = Array.isArray(content.quizQuestions)
			? content.quizQuestions
			: [];

		if (quizQuestions.length === 0) {
			return blocked([
				buildBlockingIssue({
					...issueBase,
					code: 'quiz_questions_missing',
					message: 'A aula de quiz nao possui perguntas prontas.',
				}),
			]);
		}

		return ready();
	}

	if (input.lessonType === 'pdf') {
		if (!getNonEmptyString(content.pdfPath)) {
			return blocked([
				buildBlockingIssue({
					...issueBase,
					code: 'pdf_missing',
					message:
						'A aula PDF precisa de um arquivo anexado antes da exportacao.',
				}),
			]);
		}

		return ready();
	}

	if (input.lessonType === 'external') {
		if (!getNonEmptyString(content.externalUrl)) {
			return blocked([
				buildBlockingIssue({
					...issueBase,
					code: 'external_url_missing',
					message:
						'A aula externa precisa de uma URL valida antes da exportacao.',
				}),
			]);
		}

		return ready();
	}

	return blocked([
		buildBlockingIssue({
			...issueBase,
			code: 'unsupported_lesson_type',
			message: `Tipo de aula nao suportado para exportacao automatica: ${input.lessonType}.`,
		}),
	]);
}

function ready(): LessonExportReadiness {
	return {
		isReady: true,
		readiness: 'ready',
		blockingIssues: [],
	};
}

function blocked(blockingIssues: AssetBlockingIssue[]): LessonExportReadiness {
	return {
		isReady: false,
		readiness: 'blocked',
		blockingIssues,
	};
}

function getNonEmptyString(value: unknown): string | null {
	return typeof value === 'string' && value.trim().length > 0 ? value : null;
}
