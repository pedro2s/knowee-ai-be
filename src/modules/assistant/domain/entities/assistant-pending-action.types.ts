export type AssistantPendingActionStatus =
	| 'pending'
	| 'executed'
	| 'cancelled'
	| 'failed'
	| 'expired';

export interface AssistantPendingActionProps {
	id: string;
	userId: string;
	courseId: string;
	toolName: string;
	argumentsJson: Record<string, unknown>;
	status: AssistantPendingActionStatus;
	proposedAnswer: string;
	executionResultSummary: string | null;
	errorMessage: string | null;
	createdAt: Date;
	confirmedAt: Date | null;
	completedAt: Date | null;
	expiresAt: Date;
}

export interface CreateAssistantPendingActionInput {
	userId: string;
	courseId: string;
	toolName: string;
	argumentsJson: Record<string, unknown>;
	proposedAnswer: string;
	expiresAt: Date;
}
