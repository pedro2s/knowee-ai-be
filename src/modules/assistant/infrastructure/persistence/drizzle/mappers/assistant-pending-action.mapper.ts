import { AssistantPendingAction } from 'src/modules/assistant/domain/entities/assistant-pending-action.entity';
import { AssistantPendingActionStatus } from 'src/modules/assistant/domain/entities/assistant-pending-action.types';
import { SelectAssistantPendingAction } from 'src/shared/database/infrastructure/drizzle/schema';

export class AssistantPendingActionMapper {
	static toDomain(raw: SelectAssistantPendingAction): AssistantPendingAction {
		return AssistantPendingAction.restore({
			id: raw.id,
			userId: raw.userId,
			courseId: raw.courseId,
			toolName: raw.toolName,
			argumentsJson: (raw.argumentsJson ?? {}) as Record<string, unknown>,
			status: raw.status as AssistantPendingActionStatus,
			proposedAnswer: raw.proposedAnswer,
			executionResultSummary: raw.executionResultSummary,
			errorMessage: raw.errorMessage,
			createdAt: new Date(raw.createdAt),
			confirmedAt: raw.confirmedAt ? new Date(raw.confirmedAt) : null,
			completedAt: raw.completedAt ? new Date(raw.completedAt) : null,
			expiresAt: new Date(raw.expiresAt),
		});
	}

	static toPersistence(
		entity: AssistantPendingAction
	): SelectAssistantPendingAction {
		const props = entity.toPrimitives();
		return {
			id: props.id,
			userId: props.userId,
			courseId: props.courseId,
			toolName: props.toolName,
			argumentsJson: props.argumentsJson,
			status: props.status,
			proposedAnswer: props.proposedAnswer,
			executionResultSummary: props.executionResultSummary,
			errorMessage: props.errorMessage,
			createdAt: props.createdAt.toISOString(),
			confirmedAt: props.confirmedAt?.toISOString() ?? null,
			completedAt: props.completedAt?.toISOString() ?? null,
			expiresAt: props.expiresAt.toISOString(),
		};
	}
}
