export interface CourseAIGeneratorPort {
	generate(input: CreateCouseInput): Promise<GeneratedCourse>;
}
