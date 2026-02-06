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
		const model: ChatModel = 'gpt-4.1-mini';
		const completion = await this.openai.chat.completions.create({
			model,
			messages,
			response_format: storyboardStructure,
			temperature: 0.3,
			top_p: 0.9,
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
