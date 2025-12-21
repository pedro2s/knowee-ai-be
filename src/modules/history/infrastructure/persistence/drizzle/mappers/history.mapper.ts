import { HistoryMessageEntity } from '@history/domain/entities/history-message.entity';
import { history } from '@shared/database/infrastructure/drizzle/schema';

type HistoryDb = typeof history.$inferSelect;

export class HistoryMapper {
	static toEntity(data: HistoryDb): HistoryMessageEntity {
		if (!data.message || typeof data.message !== 'object') {
			// Handle case where message is null, undefined, or not an object
			return new HistoryMessageEntity('system', '');
		}
		const message = data.message as {
			role: 'user' | 'assistant' | 'system';
			content: string;
		};
		return new HistoryMessageEntity(
			message.role ?? 'system',
			message.content ?? '',
		);
	}

	static toPersistence(entity: HistoryMessageEntity) {
		return {
			message: {
				role: entity.role,
				content: entity.content,
			},
		};
	}
}
