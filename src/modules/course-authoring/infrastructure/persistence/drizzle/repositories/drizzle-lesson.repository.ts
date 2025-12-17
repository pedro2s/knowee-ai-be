import { Injectable } from '@nestjs/common';
import { Lesson } from 'src/modules/course-authoring/domain/entities/lesson.entity';
import { ScriptSection } from 'src/modules/course-authoring/domain/entities/script-section.entity';
import { LessonRepositoryPort } from 'src/modules/course-authoring/domain/ports/lesson-repository.port';

@Injectable()
export class DrizzleLessonRepository implements LessonRepositoryPort {
	save(lesson: Lesson): Promise<Lesson> {
		throw new Error('Method not implemented.');
	}
	getScriptSections(lessonId: string): Promise<ScriptSection[]> {
		throw new Error('Method not implemented.');
	}
}
