import { HistorySummary } from 'src/shared/history/domain/entities/history-summary.entity';
import { SelectHistorySummary } from 'src/shared/database/infrastructure/drizzle/schema';

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

	static toPersistence(entity: HistorySummary): SelectHistorySummary {
		const props = entity.toPrimitives();

		return {
			userId: props.userId,
			courseId: props.courseId,
			summary: props.summary,
			createdAt: props.createdAt.toISOString(),
			updatedAt: props.updatedAt.toISOString(),
		};
	}
}
