import { Inject, Logger, PreconditionFailedException } from '@nestjs/common';
import OpenAI from 'openai';
import { ChatModel } from 'openai/resources';
import { GeneratedModule } from 'src/modules/course-authoring/domain/entities/course.types';
import {
	GenerateModuleInput,
	ModuleGeneratorPort,
} from 'src/modules/course-authoring/domain/ports/module-generator.port';
import {
	InteractionContext,
	InteractionResult,
} from 'src/shared/domain/types/interaction';
import { OPENAI_CLIENT } from 'src/shared/infrastructure/ai/ai.constants';
import { moduleStructure } from './schemas/module-structure.schema';

export class OpenAIModuleGeneratorAdapter implements ModuleGeneratorPort {
	private readonly logger = new Logger(OpenAIModuleGeneratorAdapter.name);

	constructor(@Inject(OPENAI_CLIENT) private readonly openai: OpenAI) {}

	async generate(
		context: InteractionContext<GenerateModuleInput>
	): Promise<InteractionResult<GeneratedModule>> {
		this.logger.log('Iniciando a geração do módulo...');

		const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
			{
				role: 'system',
				content: `Como assistente especializado em criação de cursos educacionais, responda de forma útil e específica para ajudar a melhorar este curso.`,
			},
		];

		if (context.summary) {
			messages.push({
				role: 'system',
				content: `Aqui está um resumo da conversa até agora:\n${context.summary}`,
			});
		}

		if (context.recentHistory) {
			for (const history of context.recentHistory) {
				const { role, content } = history.toPrimitives().message;
				messages.push({ role: role as any, content });
			}
		}

		messages.push({
			role: 'user',
			content: `Estrutura atual do curso: ${JSON.stringify(context.input.currentCourseStructure)}

			Com base na estrutura atual do curso, gere um módulo completo e de relevância para o curso.
			Certifique-se de:
			- Adaptar a quantidade de aulas conforme o contexto do curso.
			- Incluir nomes realistas e objetivos claros nos títulos e descrições.`,
		});

		this.logger.log('Enviando solicitação para a OpenAI...');
		const model: ChatModel = 'gpt-4.1';
		const completion = await this.openai.chat.completions.create({
			model,
			messages,
			response_format: moduleStructure,
			temperature: 1,
			top_p: 1,
			frequency_penalty: 0,
			presence_penalty: 0,
		});

		this.logger.log('Resposta recebida da OpenAI.');

		const content = completion.choices[0].message.content;
		if (!content) {
			this.logger.error('A API da OpenAI não retornou nenhum conteúdo.');
			throw new PreconditionFailedException(
				'A API da OpenAI não retornou nenhum conteúdo.'
			);
		}

		const module = JSON.parse(content) as GeneratedModule;

		const tokenUsage = completion.usage?.total_tokens
			? {
					totalTokens: completion.usage.total_tokens,
					model,
				}
			: undefined;

		return {
			content: module,
			tokenUsage,
		};
	}
}
