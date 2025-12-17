import { GeneratedCourse } from '../entities/course.entity';

export interface CourseRepositoryPort {
  saveCourseTree(course: GeneratedCourse, userId: string): Promise<void>;
}
