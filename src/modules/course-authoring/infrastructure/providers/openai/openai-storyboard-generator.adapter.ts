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
import { OPENAI_CLIENT } from 'src/shared/infrastructure/ai/ai.constants';
import { storyboardStructure } from './schemas/storyboard-structure.schema';

@Injectable()
export class OpenAIStoryboardGeneratorAdapter implements StoryboardGeneratorPort {
	private readonly logger = new Logger(OpenAIStoryboardGeneratorAdapter.name);

	constructor(@Inject(OPENAI_CLIENT) private readonly openai: OpenAI) {}

	async generate(
		input: GenerateStoryboardInput
	): Promise<GeneratedStoryboardOutput> {
		const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

		messages.push(
			{
				role: 'system',
				content: `Você é um diretor e editor de vídeos profissional para cursos online, com vasta experiência em criar conteúdo didático e engajador.
            Sua função é transformar o roteiro da aula em uma estrutura de cenas. Para cada frase ou parágrafo, defina o recurso visual.`,
			},
			{
				role: 'system',
				content: `Aqui está um contexto da aula a que o roteiro se refere:
                
                Título do curso: ${input.course.title}
                Descrição do curso: ${input.course.description}
                Título do módulo: ${input.module.title}
                Descrição do módulo: ${input.module.description}
                Título da aula: ${input.lesson.title}
                Descrição da aula: ${input.lesson.description}`,
			}
		);

		messages.push({
			role: 'user',
			content: input.script,
		});

		this.logger.log('Enviando solicitação para a OpenAI...');
		const model: ChatModel = 'gpt-4.1-mini';
		const completion = await this.openai.chat.completions.create({
			model,
			messages,
			response_format: storyboardStructure,
			temperature: 1,
			top_p: 1,
			frequency_penalty: 0,
			presence_penalty: 0,
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

		return generatedStoryboard;
	}
}
