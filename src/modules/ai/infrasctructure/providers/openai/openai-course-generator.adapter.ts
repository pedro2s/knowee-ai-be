import { Injectable } from '@nestjs/common';
import { CourseAIGeneratorPort } from 'src/modules/course-authoring/domain/ports/course-ai-generator.port';

@Injectable()
export class OpenAICourseGeneratorAdapter implements CourseAIGeneratorPort {
	async generate(input: CreateCouseInput): Promise<GeneratedCourse> {
		const completion =
			await OpenAICourseGeneratorAdapter.chat.completions.create({
				model: input.model ?? 'gpt-4.1',
				messages: buildCoursePrompt(input),
				response_format: courseStructure,
			});

		return JSON.parse(completion.choices[0].message.content);
	}
}
