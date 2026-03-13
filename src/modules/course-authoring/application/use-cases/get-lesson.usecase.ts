import { Injectable, NotFoundException } from '@nestjs/common';
import { LessonRepositoryPort } from '../../domain/ports/lesson-repository.port';
import { Lesson } from '../../domain/entities/lesson.entity';

@Injectable()
export class GetLessonUseCase {
	constructor(private readonly lessonRepository: LessonRepositoryPort) {}

	async execute(lessonId: string, userId: string): Promise<Lesson> {
		const lesson = await this.lessonRepository.findById(lessonId, {
			userId,
			role: 'authenticated',
		});

		if (!lesson) throw new NotFoundException('Aula não encontrada');

		return lesson;
	}
}
