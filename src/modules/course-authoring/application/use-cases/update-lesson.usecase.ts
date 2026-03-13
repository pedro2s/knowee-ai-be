import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateLessonDto } from '../dtos/update-lesson.dto';
import { LessonRepositoryPort } from '../../domain/ports/lesson-repository.port';
import { Lesson } from '../../domain/entities/lesson.entity';

@Injectable()
export class UpdateLessonUseCase {
	constructor(private readonly lessonRepository: LessonRepositoryPort) {}

	async execute(
		lessonId: string,
		updateData: UpdateLessonDto,
		userId: string
	): Promise<Lesson> {
		const updatedModule = await this.lessonRepository.update(
			lessonId,
			updateData,
			{
				userId,
				role: 'authenticated',
			}
		);

		if (!updatedModule) throw new NotFoundException('Aula não encontrado');

		return updatedModule;
	}
}
