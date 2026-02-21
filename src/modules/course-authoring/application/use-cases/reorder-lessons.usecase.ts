import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
	LESSON_REPOSITORY,
	type LessonRepositoryPort,
} from '../../domain/ports/lesson-repository.port';
import { ReorderLessonsDto } from '../dtos/reorder-lessons.dto';
import { AuthContext } from 'src/shared/application/ports/db-context.port';

@Injectable()
export class ReorderLessonsUseCase {
	constructor(
		@Inject(LESSON_REPOSITORY)
		private readonly lessonRepository: LessonRepositoryPort
	) {}

	async execute(input: {
		dto: ReorderLessonsDto;
		userId: string;
	}): Promise<void> {
		const authContext: AuthContext = {
			userId: input.userId,
			role: 'authenticated',
		};

		const lessons = await this.lessonRepository.findAllByModuleId(
			input.dto.moduleId,
			authContext
		);

		const lessonIdSet = new Set(lessons.map((lesson) => lesson.id));
		for (const item of input.dto.items) {
			if (!lessonIdSet.has(item.id)) {
				throw new BadRequestException(
					`Aula ${item.id} não pertence ao módulo informado`
				);
			}
		}

		for (const item of input.dto.items) {
			await this.lessonRepository.update(
				item.id,
				{ orderIndex: item.orderIndex },
				authContext
			);
		}
	}
}
