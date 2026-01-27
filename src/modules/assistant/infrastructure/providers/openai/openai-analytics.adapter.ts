import {
	Inject,
	Injectable,
	PreconditionFailedException,
} from '@nestjs/common';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
import {
	AIAnalyticsPort,
	AnalysisOutput,
} from 'src/modules/assistant/domain/ports/ai-analyze.port';
import { OPENAI_CLIENT } from 'src/shared/infrastructure/ai/ai.constants';

@Injectable()
export class OpenAIAnalyticsAdapter implements AIAnalyticsPort {
	constructor(@Inject(OPENAI_CLIENT) private readonly openai: OpenAI) {}

	async analyze(input: {
		title: string;
		description: string;
	}): Promise<AnalysisOutput> {
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

		const completion = await this.openai.chat.completions.create({
			model: 'gpt-4.1-nano',
			messages: messages,
		});

		const content = completion.choices[0].message.content;

		if (!content)
			throw new PreconditionFailedException(
				'A API da OpenAI não retornou nenhum conteúdo.'
			);

		const analysis: AnalysisOutput = JSON.parse(content) as AnalysisOutput;

		return analysis;
	}
}
