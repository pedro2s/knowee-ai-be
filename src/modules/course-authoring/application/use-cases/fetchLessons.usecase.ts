import { Inject, Injectable } from '@nestjs/common';
import { Lesson } from '../../domain/entities/lesson.entity';
import {
	LESSON_REPOSITORY,
	type LessonRepositoryPort,
} from '../../domain/ports/lesson-repository.port';

@Injectable()
export class FetchLessonsUseCase {
	constructor(
		@Inject(LESSON_REPOSITORY)
		private readonly lessonRepository: LessonRepositoryPort,
	) {}

	execute(moduleId: string, userId: string): Promise<Lesson[]> {
		return this.lessonRepository.findAllByModuleId(moduleId, {
			userId,
			role: 'authenticated',
		});
	}
}
