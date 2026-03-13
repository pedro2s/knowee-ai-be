import { Injectable } from '@nestjs/common';
import { CreateModuleTreeUseCase } from 'src/modules/course-authoring/application/use-cases/create-module-tree.usecase';
import { AssistantToolInvocation } from './assistant-tool.registry';

@Injectable()
export class AssistantToolExecutor {
	constructor(
		private readonly createModuleTreeUseCase: CreateModuleTreeUseCase
	) {}

	buildConfirmationMessage(invocation: AssistantToolInvocation): string {
		if (invocation.name === 'create_module') {
			const totalLessons = invocation.normalizedArguments.lessons?.length ?? 0;
			return `Posso criar o módulo "${invocation.normalizedArguments.title}" com ${totalLessons} aula(s). Responda "confirmar" para executar ou "cancelar" para abortar.`;
		}

		return 'Há uma ação pendente aguardando confirmação. Responda "confirmar" ou "cancelar".';
	}

	async execute(
		invocation: AssistantToolInvocation,
		userId: string
	): Promise<{ summary: string; userMessage: string }> {
		if (invocation.name === 'create_module') {
			const module = await this.createModuleTreeUseCase.execute(
				invocation.normalizedArguments,
				userId
			);
			const lessonCount = module.lessons?.length ?? 0;
			const moduleTitle = String(module.title);
			return {
				summary: `Módulo ${moduleTitle} criado com ${lessonCount} aula(s).`,
				userMessage: `A ação foi executada com sucesso. O módulo "${moduleTitle}" foi criado com ${lessonCount} aula(s).`,
			};
		}

		throw new Error('Ferramenta não suportada.');
	}
}
