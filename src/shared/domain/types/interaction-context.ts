import { History } from 'src/modules/history/domain/entities/history.entity';

export interface InteractionContext<T> {
	input: T;
	summary: string | null;
	recentHistory: History[];
}
