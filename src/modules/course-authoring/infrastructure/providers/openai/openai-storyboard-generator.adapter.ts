import {
	Inject,
	Injectable,
	Logger,
	PreconditionFailedException,
} from '@nestjs/common';
import OpenAI from 'openai';
import { ChatModel } from 'openai/resources';
import {
	GenerateStoryboardInput,
	GeneratedStoryboardOutput,
	StoryboardGeneratorPort,
} from 'src/modules/course-authoring/domain/ports/storyboard-generator.port';
import { OPENAI_CLIENT } from 'src/shared/ai-providers/ai-providers.constants';
import { storyboardStructure } from './schemas/storyboard-structure.schema';
import { buildOpenAITextUsage } from 'src/shared/token-usage/infrastructure/ai-usage-metrics.factory';
import { LLMExecutionPolicyService } from 'src/shared/ai-providers/infrastructure/llm-execution-policy.service';

@Injectable()
export class OpenAIStoryboardGeneratorAdapter implements StoryboardGeneratorPort {
	private readonly logger = new Logger(OpenAIStoryboardGeneratorAdapter.name);

	constructor(
		@Inject(OPENAI_CLIENT) private readonly openai: OpenAI,
		private readonly llmExecutionPolicy: LLMExecutionPolicyService
	) {}

	async generate(
		input: GenerateStoryboardInput
	): Promise<GeneratedStoryboardOutput> {
		const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
			{
				role: 'system',
				content: `Você é um diretor de vídeo educacional.
				Transforme o trecho do roteiro da aula em uma ou mais cenas visuais estruturadas.
				Ao descrever a imagem ('visualConcept'), NÃO descreva pessoas ou cenários realistas.
				Descreva diagramas conceituais simplificados, ícones 3D minimalistas ou formas abstratas que representem o tópico.
				Ex: Para 'Erro de servidor', descreva 'A simple geometric red cross floating over a stylized server icon'.
                
				Contexto:
                Curso: ${input.course.title}
                Módulo: ${input.module.title}
                Aula: ${input.lesson.title}`,
			},
		];

		messages.push({
			role: 'user',
			content: input.script,
		});

		this.logger.log('Enviando solicitação para a OpenAI...');
		const policy = this.llmExecutionPolicy.resolve(
			'course_authoring.generate_storyboard',
			'openai'
		);
		const model = policy.model as ChatModel;
		if (policy.optimized) {
			this.logger.debug(
				`Usando policy otimizada para course_authoring.generate_storyboard com modelo ${policy.model}`
			);
		}
		const completion = await this.openai.chat.completions.create({
			model,
			messages,
			response_format: storyboardStructure,
			...(policy.temperature !== undefined
				? { temperature: policy.temperature }
				: {}),
			...(policy.topP !== undefined ? { top_p: policy.topP } : {}),
			...(policy.frequencyPenalty !== undefined
				? { frequency_penalty: policy.frequencyPenalty }
				: {}),
			...(policy.presencePenalty !== undefined
				? { presence_penalty: policy.presencePenalty }
				: {}),
			...(policy.maxCompletionTokens !== undefined
				? { max_completion_tokens: policy.maxCompletionTokens }
				: {}),
		});

		const content = completion.choices[0].message.content;
		if (!content) {
			this.logger.error('A API da OpenAI não retornou nenhum conteúdo.');
			throw new PreconditionFailedException(
				'A API da OpenAI não retornou nenhum conteúdo.'
			);
		}

		const generatedStoryboard = JSON.parse(
			content
		) as GeneratedStoryboardOutput;

		return {
			...generatedStoryboard,
			tokenUsage: buildOpenAITextUsage({
				model,
				operation: 'course_authoring.generate_storyboard',
				modality: 'text',
				usage: completion.usage,
			}),
		};
	}
}
