import {
	Inject,
	Injectable,
	PreconditionFailedException,
	Logger,
} from '@nestjs/common';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
import {
	AIAnalyticsPort,
	AnalysisResult,
} from 'src/modules/assistant/domain/ports/ai-analyze.port';
import { OPENAI_CLIENT } from 'src/shared/ai-providers/ai-providers.constants';
import { analyzeStructure } from './schemas/analyze-structure';
import { buildOpenAITextUsage } from 'src/shared/token-usage/infrastructure/ai-usage-metrics.factory';
import { LLMExecutionPolicyService } from 'src/shared/ai-providers/infrastructure/llm-execution-policy.service';

@Injectable()
export class OpenAIAnalyticsAdapter implements AIAnalyticsPort {
	private readonly logger = new Logger(OpenAIAnalyticsAdapter.name);

	constructor(
		@Inject(OPENAI_CLIENT) private readonly openai: OpenAI,
		private readonly llmExecutionPolicy: LLMExecutionPolicyService
	) {}

	async analyze(input: {
		title: string;
		description: string;
	}): Promise<AnalysisResult> {
		const { title, description } = input;

		const messages: ChatCompletionMessageParam[] = [
			{
				role: 'system',
				content: `Como assistente especializado em criação de cursos educacionais, analise o título e a descrição fornecidos pelo usuário.
                Para cada um, retorne um objecto contendo:
                1. status: good (bom), bad (ruim) ou neutral (imparcial).
                2. message: Uma frase curta de feedback (Exemplo: Um pouco curto, que tal adicionar mais detralhes?).
                Além disso, com base no título e na descrição detecte a categoria e o nível e estipule a duração do curso, quando as informações fornecidas pelo usuário forem relevantes.
                `,
			},
			{
				role: 'user',
				content: `Título: ${title}\nDescrição: ${description}`,
			},
		];

		const policy = this.llmExecutionPolicy.resolve(
			'assistant.analytics',
			'openai'
		);
		if (policy.optimized) {
			this.logger.debug(
				`Usando policy otimizada para assistant.analytics com modelo ${policy.model}`
			);
		}

		const completion = await this.openai.chat.completions.create({
			model: policy.model,
			messages,
			response_format: analyzeStructure,
			...(policy.temperature !== undefined
				? { temperature: policy.temperature }
				: {}),
			...(policy.topP !== undefined ? { top_p: policy.topP } : {}),
			...(policy.maxCompletionTokens !== undefined
				? { max_completion_tokens: policy.maxCompletionTokens }
				: {}),
		});

		const content = completion.choices[0].message.content;

		if (!content)
			throw new PreconditionFailedException(
				'A API da OpenAI não retornou nenhum conteúdo.'
			);

		const analysis = JSON.parse(content) as AnalysisResult['analysis'];

		return {
			analysis,
			tokenUsage: buildOpenAITextUsage({
				model: policy.model,
				operation: 'assistant.analytics',
				modality: 'analysis',
				usage: completion.usage,
			}),
		};
	}
}
