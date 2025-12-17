import { CreateCouseInput, GeneratedCourse } from '../entities/course.entity';

export interface CourseAIGeneratorPort {
	generate(input: CreateCouseInput): Promise<GeneratedCourse>;
}
