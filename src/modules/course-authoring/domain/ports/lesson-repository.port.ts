import { AuthContext } from 'src/shared/database/domain/ports/db-context.port';
import type { Lesson } from '../entities/lesson.entity';
import type { CreateLessonInput } from '../entities/lesson.types';

export abstract class LessonRepositoryPort {
	abstract create(lesson: Lesson, auth: AuthContext): Promise<Lesson>;
	abstract findById(id: string, auth: AuthContext): Promise<Lesson | null>;
	abstract findAllByModuleId(
		moduleId: string,
		auth: AuthContext
	): Promise<Lesson[]>;
	abstract update(
		id: string,
		lesson: Partial<CreateLessonInput>,
		auth: AuthContext
	): Promise<Lesson | null>;
	abstract delete(id: string, auth: AuthContext): Promise<void>;
}
