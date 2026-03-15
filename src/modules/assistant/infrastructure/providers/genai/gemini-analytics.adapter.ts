import {
	Inject,
	Injectable,
	PreconditionFailedException,
	Logger,
} from '@nestjs/common';
import {
	AIAnalyticsPort,
	AnalysisResult,
} from 'src/modules/assistant/domain/ports/ai-analyze.port';
import { GENAI_CLIENT } from 'src/shared/ai-providers/ai-providers.constants';
import { GoogleGenAI, Content } from '@google/genai';
import { analyzeSchema, analyzeStructure } from './schemas/analyze-structure';
import { buildGeminiTextUsage } from 'src/shared/token-usage/infrastructure/ai-usage-metrics.factory';
import { LLMExecutionPolicyService } from 'src/shared/ai-providers/infrastructure/llm-execution-policy.service';

@Injectable()
export class GenAIAnalyticsAdapter implements AIAnalyticsPort {
	private readonly logger = new Logger(GenAIAnalyticsAdapter.name);

	constructor(
		@Inject(GENAI_CLIENT) private readonly googleGenAI: GoogleGenAI,
		private readonly llmExecutionPolicy: LLMExecutionPolicyService
	) {}

	async analyze(input: {
		title: string;
		description: string;
	}): Promise<AnalysisResult> {
		const { title, description } = input;

		const messages: Content[] = [
			{
				role: 'system',
				parts: [
					{
						text: `Como assistente especializado em criação de cursos educacionais, analise o título e a descrição fornecidos pelo usuário.
                Para cada um, retorne um objecto contendo:
                1. status: good (bom), bad (ruim) ou neutral (imparcial).
                2. message: Uma frase curta de feedback (Exemplo: Um pouco curto, que tal adicionar mais detralhes?).
                Além disso, com base no título e na descrição detecte a categoria e o nível e estipule a duração do curso, quando as informações fornecidas pelo usuário forem relevantes.
                `,
					},
				],
			},
			{
				role: 'user',
				parts: [{ text: `Título: ${title}\nDescrição: ${description}` }],
			},
		];

		const policy = this.llmExecutionPolicy.resolve(
			'assistant.analytics',
			'google'
		);
		if (policy.optimized) {
			this.logger.debug(
				`Usando policy otimizada para assistant.analytics/google com modelo ${policy.model}`
			);
		}

		const response = await this.googleGenAI.models.generateContent({
			model: policy.model,
			contents: messages,
			config: {
				responseMimeType: 'application/json',
				responseJsonSchema: analyzeStructure,
				...(policy.temperature !== undefined
					? { temperature: policy.temperature }
					: {}),
				...(policy.topP !== undefined ? { topP: policy.topP } : {}),
				...(policy.maxCompletionTokens !== undefined
					? { maxOutputTokens: policy.maxCompletionTokens }
					: {}),
			},
		});

		if (!response.text)
			throw new PreconditionFailedException(
				'A API do Gemini não retornou nenhum conteúdo.'
			);

		const analysis = analyzeSchema.parse(JSON.parse(response.text));

		return {
			analysis: analysis as AnalysisResult['analysis'],
			tokenUsage: buildGeminiTextUsage({
				model: policy.model,
				operation: 'assistant.analytics',
				modality: 'analysis',
				usageMetadata: response.usageMetadata,
			}),
		};
	}
}
