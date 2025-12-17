import { Lesson } from '../entities/lesson.entity';
import { ScriptSection } from '../entities/script-section.entity';

export interface LessonRepositoryPort {
  save(lesson: Lesson): Promise<Lesson>;
  getScriptSections(lessonId: string): Promise<ScriptSection[]>;
  // Add other lesson-related methods as needed
}
