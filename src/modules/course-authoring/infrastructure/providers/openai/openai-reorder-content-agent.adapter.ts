import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { Course } from 'src/modules/course-authoring/domain/entities/course.entity';
import {
	CourseSummary,
	ReorderContentAgentPort,
} from 'src/modules/course-authoring/domain/ports/reorder-content-agent.port';
import {
	InteractionContext,
	InteractionResult,
} from 'src/shared/domain/types/interaction';
import { OPENAI_CLIENT } from 'src/shared/infrastructure/ai/ai.constants';

@Injectable()
export class OpenAIReorderContentAgentAdapter implements ReorderContentAgentPort {
	constructor(@Inject(OPENAI_CLIENT) private readonly openai: OpenAI) {}

	reorderContent(
		input: InteractionContext<CourseSummary>
	): Promise<InteractionResult<Course>> {
		const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
			{
				role: 'system',
				content: `Como assistente especializado em criação de cursos educacionais, responda de forma útil e específica para ajudar a melhorar este curso.`,
			},
		];

		throw new Error('Method not implemented.');
	}
}
