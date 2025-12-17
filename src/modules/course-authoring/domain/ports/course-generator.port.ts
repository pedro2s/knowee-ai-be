import { CreateCouseInput, GeneratedCourse } from '../entities/course.entity';

export interface CourseGeneratorPort {
	generate(input: CreateCouseInput): Promise<GeneratedCourse>;
}
