import {
	Inject,
	Injectable,
	PreconditionFailedException,
} from '@nestjs/common';
import {
	AIAnalyticsPort,
	AnalysisOutput,
} from 'src/modules/assistant/domain/ports/ai-analyze.port';
import { GENAI_CLIENT } from 'src/shared/ai-providers/ai-providers.constants';
import { GoogleGenAI, Content } from '@google/genai';
import { analyzeSchema, analyzeStructure } from './schemas/analyze-structure';

@Injectable()
export class GenAIAnalyticsAdapter implements AIAnalyticsPort {
	constructor(
		@Inject(GENAI_CLIENT) private readonly googleGenAI: GoogleGenAI
	) {}

	async analyze(input: {
		title: string;
		description: string;
	}): Promise<AnalysisOutput> {
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

		const response = await this.googleGenAI.models.generateContent({
			model: 'gemini-3-flash-preview',
			contents: messages,
			config: {
				responseMimeType: 'application/json',
				responseJsonSchema: analyzeStructure,
			},
		});

		if (!response.text)
			throw new PreconditionFailedException(
				'A API do Gemini não retornou nenhum conteúdo.'
			);

		const analysis = analyzeSchema.parse(JSON.parse(response.text));

		return analysis as AnalysisOutput;
	}
}
