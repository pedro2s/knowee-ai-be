import { Lesson } from '../entities/lesson.entity';

export const LESSON_REPOSITORY = 'LessonRepository';

export interface LessonRepositoryPort {
	create(lesson: Lesson): Promise<Lesson>;
	update(id: string, lesson: Partial<Lesson>): Promise<Lesson | null>;
	findById(id: string): Promise<Lesson | null>;
	findAllByModuleId(moduleId: string): Promise<Lesson[]>;
	delete(id: string): Promise<void>;
}
