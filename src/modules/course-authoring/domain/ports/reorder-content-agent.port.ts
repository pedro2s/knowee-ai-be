import {
	InteractionContext,
	InteractionResult,
} from 'src/shared/types/interaction';

export const REORDER_CONTENT_AGENT = Symbol('REORDER_CONTENT_AGENT');

export interface CourseSummary {
	id: string;
	title: string;
	description: string;
	modules: Array<{
		id: string;
		title: string;
		description: string;
		orderIndex: number;
		lessons?: Array<{
			id: string;
			title: string;
			description: string;
			orderIndex: number;
			lessonType: string;
		}>;
	}>;
}

export interface ReorderedContentResult {
	modules: Array<{
		id: string;
		orderIndex: number;
	}>;
}

export interface ReorderContentAgentPort {
	reorderContent(
		input: InteractionContext<CourseSummary>
	): Promise<InteractionResult<ReorderedContentResult>>;
}
