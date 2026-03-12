import { randomUUID } from 'crypto';
import {
	AssistantPendingActionProps,
	CreateAssistantPendingActionInput,
} from './assistant-pending-action.types';

export class AssistantPendingAction {
	private constructor(private readonly props: AssistantPendingActionProps) {}

	static create(
		input: CreateAssistantPendingActionInput
	): AssistantPendingAction {
		return new AssistantPendingAction({
			id: randomUUID(),
			userId: input.userId,
			courseId: input.courseId,
			toolName: input.toolName,
			argumentsJson: input.argumentsJson,
			status: 'pending',
			proposedAnswer: input.proposedAnswer,
			executionResultSummary: null,
			errorMessage: null,
			createdAt: new Date(),
			confirmedAt: null,
			completedAt: null,
			expiresAt: input.expiresAt,
		});
	}

	static restore(props: AssistantPendingActionProps): AssistantPendingAction {
		return new AssistantPendingAction(props);
	}

	get id(): string {
		return this.props.id;
	}

	get userId(): string {
		return this.props.userId;
	}

	get courseId(): string {
		return this.props.courseId;
	}

	get toolName(): string {
		return this.props.toolName;
	}

	get argumentsJson(): Record<string, unknown> {
		return this.props.argumentsJson;
	}

	get status() {
		return this.props.status;
	}

	get proposedAnswer(): string {
		return this.props.proposedAnswer;
	}

	get expiresAt(): Date {
		return this.props.expiresAt;
	}

	isExpired(now = new Date()): boolean {
		return this.props.expiresAt.getTime() <= now.getTime();
	}

	confirm(): AssistantPendingAction {
		return AssistantPendingAction.restore({
			...this.props,
			confirmedAt: new Date(),
		});
	}

	execute(summary: string): AssistantPendingAction {
		const now = new Date();
		return AssistantPendingAction.restore({
			...this.props,
			status: 'executed',
			executionResultSummary: summary,
			errorMessage: null,
			confirmedAt: this.props.confirmedAt ?? now,
			completedAt: now,
		});
	}

	cancel(): AssistantPendingAction {
		return AssistantPendingAction.restore({
			...this.props,
			status: 'cancelled',
			completedAt: new Date(),
		});
	}

	fail(errorMessage: string): AssistantPendingAction {
		const now = new Date();
		return AssistantPendingAction.restore({
			...this.props,
			status: 'failed',
			errorMessage,
			confirmedAt: this.props.confirmedAt ?? now,
			completedAt: now,
		});
	}

	expire(): AssistantPendingAction {
		return AssistantPendingAction.restore({
			...this.props,
			status: 'expired',
			completedAt: new Date(),
		});
	}

	toPrimitives(): AssistantPendingActionProps {
		return { ...this.props };
	}
}
