import { History } from 'src/modules/history/domain/entities/history.entity';
import { HistoryMessage } from 'src/modules/history/domain/value-objects/history-message.vo';
import { SelectHistory } from 'src/shared/infrastructure/database/drizzle/schema';

export class HistoryMapper {
	/** Banco de Dados -> Domínio (Entity + VOs) */
	static toDomain(raw: SelectHistory): History {
		const { role, content } = raw.message as {
			role: 'user' | 'assistant' | 'system';
			content: string;
		};

		const messageVO = HistoryMessage.create(role, content);

		return History.restore({
			id: raw.id,
			userId: raw.userId,
			courseId: raw.courseId,
			message: messageVO,
			createdAt: new Date(raw.createdAt),
		});
	}

	static toPersistence(entity: History): SelectHistory {
		const props = entity.toPrimitives();

		return {
			id: props.id,
			userId: props.userId,
			courseId: props.courseId,
			message: props.message,
			createdAt: props.createdAt.toISOString(),
		};
	}
}
