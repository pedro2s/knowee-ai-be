import { HistorySummary } from 'src/modules/history/domain/entities/history-summary.entity';
import { History } from 'src/modules/history/domain/entities/history.entity';
import {
	SelectHistory,
	SelectHistorySummary,
} from 'src/shared/database/infrastructure/drizzle/schema';

export class HistorySummaryMapper {
	/** Banco de Dados -> Domínio (Entity + VOs) */
	static toDomain(raw: SelectHistorySummary): HistorySummary {
		return HistorySummary.restore({
			userId: raw.userId,
			courseId: raw.courseId,
			summary: raw.summary,
			createdAt: new Date(raw.createdAt),
			updatedAt: new Date(raw.updatedAt),
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
