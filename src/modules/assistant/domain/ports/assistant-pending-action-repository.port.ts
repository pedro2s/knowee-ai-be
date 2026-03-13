import { AuthContext } from 'src/shared/database/domain/ports/db-context.port';
import { AssistantPendingAction } from '../entities/assistant-pending-action.entity';

export abstract class AssistantPendingActionRepositoryPort {
	abstract save(
		action: AssistantPendingAction,
		auth: AuthContext
	): Promise<AssistantPendingAction>;

	abstract findPendingByCourseId(
		courseId: string,
		auth: AuthContext
	): Promise<AssistantPendingAction | null>;
}
