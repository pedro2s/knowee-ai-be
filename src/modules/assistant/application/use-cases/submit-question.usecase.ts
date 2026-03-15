import { Injectable, Logger } from '@nestjs/common';
import { QuestionAnswerRepositoryPort } from '../../domain/ports/question-anwer-repository.port';
import { SubmitQuestionDto } from '../dtos/submit-question.dto';
import { AuthContext } from 'src/shared/database/domain/ports/db-context.port';
import { QuestionAnswer } from 'src/modules/assistant/domain/entities/question-answer.entity';
import { ProviderRegistry } from '../../infrastructure/providers/provider.registry';
import { HistoryServicePort } from 'src/shared/history/domain/ports/history-service.port';
import { AssistantPendingActionRepositoryPort } from '../../domain/ports/assistant-pending-action-repository.port';
import { AssistantPendingAction } from '../../domain/entities/assistant-pending-action.entity';
import { AssistantToolRegistry } from '../services/assistant-tool.registry';
import { AssistantToolExecutor } from '../services/assistant-tool.executor';
import { QuestionAnswered } from '../../domain/entities/question-answer.types';
import { TokenUsagePort } from 'src/shared/token-usage/domain/ports/token-usage.port';

const CONFIRMATION_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class SubmitQuestionUseCase {
	private readonly logger = new Logger(SubmitQuestionUseCase.name);

	constructor(
		private readonly providerRegistry: ProviderRegistry,
		private readonly questionAnswerRepository: QuestionAnswerRepositoryPort,
		private readonly historyService: HistoryServicePort,
		private readonly pendingActionRepository: AssistantPendingActionRepositoryPort,
		private readonly assistantToolRegistry: AssistantToolRegistry,
		private readonly assistantToolExecutor: AssistantToolExecutor,
		private readonly tokenUsageService: TokenUsagePort
	) {}

	async execute(
		input: SubmitQuestionDto,
		userId: string
	): Promise<QuestionAnswered> {
		const { courseId, question } = input;

		const auth: AuthContext = {
			userId: userId,
			role: 'authenticated',
		};

		const normalizedQuestion = question.trim().toLowerCase();
		const pendingAction = await this.getPendingAction(courseId, auth);

		if (!pendingAction && normalizedQuestion === 'confirmar') {
			return {
				answer: 'Não há nenhuma ação pendente para confirmar.',
				action: {
					status: 'none',
				},
			};
		}

		if (!pendingAction && normalizedQuestion === 'cancelar') {
			return {
				answer: 'Não há nenhuma ação pendente para cancelar.',
				action: {
					status: 'none',
				},
			};
		}

		if (pendingAction) {
			if (normalizedQuestion === 'confirmar') {
				return this.handleConfirmation(pendingAction, question, auth);
			}

			if (normalizedQuestion === 'cancelar') {
				const cancelled = pendingAction.cancel();
				await this.pendingActionRepository.save(cancelled, auth);
				const answer = 'A ação pendente foi cancelada.';
				await this.persistInteraction(courseId, question, answer, auth);
				return {
					answer,
					action: {
						status: 'cancelled',
						type: cancelled.toolName,
					},
				};
			}

			const answer = `${pendingAction.proposedAnswer} Ainda há uma ação pendente aguardando confirmação. Responda "confirmar" ou "cancelar".`;
			await this.persistInteraction(courseId, question, answer, auth);
			return {
				answer,
				action: {
					status: 'pending_confirmation',
					type: pendingAction.toolName,
					pendingActionId: pendingAction.id,
				},
			};
		}

		const summary = await this.historyService.getSummary(courseId, auth);
		const window = await this.historyService.getWindowMessages(courseId, auth);

		const aiAssistant = this.providerRegistry.getAIAssistantStrategy(
			input.provider || 'openai'
		);

		const { content: questionAnswered, tokenUsage } = await aiAssistant.ask({
			input: { question },
			summary: summary || null,
			recentHistory: window,
			tools: this.assistantToolRegistry.getDefinitions(),
		});

		if (tokenUsage) {
			await this.tokenUsageService.record({
				userId: auth.userId,
				courseId,
				...tokenUsage,
			});
		}

		if (questionAnswered.toolCall) {
			const validation = this.assistantToolRegistry.validateToolCall(
				questionAnswered.toolCall,
				{ courseId }
			);

			if (!validation.success) {
				const answer = `${validation.error} Peça novamente com todos os parâmetros obrigatórios.`;
				await this.persistInteraction(courseId, question, answer, auth);
				return {
					answer,
					action: {
						status: 'failed',
						type: questionAnswered.toolCall.name,
					},
				};
			}

			const proposalAnswer =
				this.assistantToolExecutor.buildConfirmationMessage(
					validation.invocation
				);
			this.logger.log(
				`Tool proposta ${validation.invocation.name} para course ${courseId} com ${validation.invocation.normalizedArguments.lessons?.length ?? 0} aula(s).`
			);

			const createdAction = AssistantPendingAction.create({
				userId: auth.userId,
				courseId,
				toolName: validation.invocation.name,
				argumentsJson: validation.invocation.rawArguments,
				proposedAnswer: proposalAnswer,
				expiresAt: new Date(Date.now() + CONFIRMATION_TTL_MS),
			});
			const savedAction = await this.pendingActionRepository.save(
				createdAction,
				auth
			);

			await this.persistInteraction(courseId, question, proposalAnswer, auth);
			return {
				answer: proposalAnswer,
				action: {
					status: 'pending_confirmation',
					type: savedAction.toolName,
					pendingActionId: savedAction.id,
				},
			};
		}

		await this.persistInteraction(
			courseId,
			question,
			questionAnswered.answer,
			auth
		);

		return {
			answer: questionAnswered.answer,
			action: {
				status: 'none',
			},
		};
	}

	private async getPendingAction(
		courseId: string,
		auth: AuthContext
	): Promise<AssistantPendingAction | null> {
		const pending = await this.pendingActionRepository.findPendingByCourseId(
			courseId,
			auth
		);

		if (!pending) {
			return null;
		}

		if (!pending.isExpired()) {
			return pending;
		}

		await this.pendingActionRepository.save(pending.expire(), auth);
		return null;
	}

	private async handleConfirmation(
		pendingAction: AssistantPendingAction,
		question: string,
		auth: AuthContext
	): Promise<QuestionAnswered> {
		const confirmation = pendingAction.confirm();
		await this.pendingActionRepository.save(confirmation, auth);

		const validation = this.assistantToolRegistry.validateToolCall(
			{
				name: confirmation.toolName,
				arguments: confirmation.argumentsJson,
			},
			{
				courseId: confirmation.courseId,
			}
		);

		if (!validation.success) {
			const failed = confirmation.fail(validation.error);
			await this.pendingActionRepository.save(failed, auth);
			const answer = `${validation.error} A ação pendente foi marcada como inválida.`;
			await this.persistInteraction(
				confirmation.courseId,
				question,
				answer,
				auth
			);
			return {
				answer,
				action: {
					status: 'failed',
					type: failed.toolName,
				},
			};
		}

		try {
			this.logger.log(
				`Executando tool ${validation.invocation.name} para course ${confirmation.courseId} com ${validation.invocation.normalizedArguments.lessons?.length ?? 0} aula(s).`
			);
			const result = await this.assistantToolExecutor.execute(
				validation.invocation,
				auth.userId
			);
			const executed = confirmation.execute(result.summary);
			await this.pendingActionRepository.save(executed, auth);
			await this.persistInteraction(
				confirmation.courseId,
				question,
				result.userMessage,
				auth
			);
			return {
				answer: result.userMessage,
				action: {
					status: 'executed',
					type: executed.toolName,
				},
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Não foi possível executar a ação solicitada.';
			const failed = confirmation.fail(errorMessage);
			await this.pendingActionRepository.save(failed, auth);
			const answer = this.buildExecutionFailureMessage(
				confirmation.toolName,
				errorMessage
			);
			await this.persistInteraction(
				confirmation.courseId,
				question,
				answer,
				auth
			);
			return {
				answer,
				action: {
					status: 'failed',
					type: failed.toolName,
				},
			};
		}
	}

	private buildExecutionFailureMessage(
		toolName: string,
		errorMessage: string
	): string {
		if (
			toolName === 'create_module' &&
			/course|curso|foreign key|policy|permission|rls/i.test(errorMessage)
		) {
			return 'Não consegui criar o módulo neste curso.';
		}

		if (toolName === 'create_module') {
			return `Não consegui criar o módulo neste curso. Detalhe técnico: ${errorMessage}`;
		}

		return `Não foi possível executar a ação solicitada: ${errorMessage}`;
	}

	private async persistInteraction(
		courseId: string,
		question: string,
		answer: string,
		auth: AuthContext
	): Promise<void> {
		await this.historyService.saveMessage(courseId, 'user', question, auth);
		await this.historyService.saveMessageAndSummarizeIfNecessary(
			courseId,
			'assistant',
			answer,
			auth
		);

		const qaEntity = QuestionAnswer.create({
			userId: auth.userId,
			courseId,
			question,
			answer,
		});
		await this.questionAnswerRepository.create(qaEntity, auth);
	}
}
