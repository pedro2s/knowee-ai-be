import { AuthContext } from 'src/shared/application/ports/db-context.port';
import type { Lesson } from '../entities/lesson.entity';
import type { CreateLessonInput } from '../entities/lesson.types';

export const LESSON_REPOSITORY = 'LessonRepository';

export interface LessonRepositoryPort {
	create(lesson: Lesson, auth: AuthContext): Promise<Lesson>;
	findById(id: string, auth: AuthContext): Promise<Lesson | null>;
	findAllByModuleId(moduleId: string, auth: AuthContext): Promise<Lesson[]>;
	update(
		id: string,
		lesson: Partial<CreateLessonInput>,
		auth: AuthContext
	): Promise<Lesson | null>;
	delete(id: string, auth: AuthContext): Promise<void>;
}
