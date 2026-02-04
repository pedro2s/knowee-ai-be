import {
	InteractionContext,
	InteractionResult,
} from 'src/shared/domain/types/interaction';
import { Course } from '../entities/course.entity';

export const REORDER_CONTENT_AGENT = Symbol('REORDER_CONTENT_AGENT');

export interface CourseSummary {
	id: string;
	title: string;
	description: string;
	modules: Array<{
		title: string;
		description: string;
		orderIndex: number;
		lessons?: Array<{
			title: string;
			description: string;
			orderIndex: number;
			lessonType: string;
		}>;
	}>;
}

export interface ReorderContentAgentPort {
	reorderContent(
		input: InteractionContext<CourseSummary>
	): Promise<InteractionResult<Course>>;
}
