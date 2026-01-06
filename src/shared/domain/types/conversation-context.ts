import { History } from 'src/modules/history/domain/entities/history.entity';

export interface ConversationContext {
	summary: string | null;
	recentHistory: History[];
}
