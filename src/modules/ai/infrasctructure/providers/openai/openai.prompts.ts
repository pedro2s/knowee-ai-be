import { CreateCourseInput } from 'src/modules/course-authoring/domain/entities/course.types';
import OpenAI from 'openai';

const courseSchema = {
	type: 'object',
	properties: {
		course: {
			type: 'object',
			properties: {
				title: { type: 'string' },
				description: { type: 'string' },
				category: { type: 'string' },
				level: { type: 'string' },
				duration: { type: 'string' },
				targetAudience: { type: 'string' },
			},
			required: [
				'title',
				'description',
				'category',
				'level',
				'duration',
				'targetAudience',
			],
		},
		lessons: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					title: { type: 'string' },
					content: { type: 'string' },
					order: { type: 'number' },
				},
				required: ['title', 'content', 'order'],
			},
		},
	},
	required: ['course', 'lessons'],
};

export function buildCoursePrompt(
	input: CreateCourseInput,
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
	return [
		{
			role: 'system',
			content: `You are an expert course creator. Your task is to generate a detailed course structure and content based on the user's request.
      The course should be engaging, informative, and well-structured.
      The response should be in JSON format, strictly adhering to the following JSON schema:
      ${JSON.stringify(courseSchema, null, 2)}
      `,
		},
		{
			role: 'user',
			content: `Create a course with the following details:
      Title: ${input.title}
      ${input.description ? `Description: ${input.description}` : ''}
      ${input.category ? `Category: ${input.category}` : ''}
      ${input.level ? `Level: ${input.level}` : ''}
      ${input.duration ? `Duration: ${input.duration}` : ''}
      ${input.targetAudience ? `Target Audience: ${input.targetAudience}` : ''}
      `,
		},
	];
}

export const courseStructure = { type: 'json_object' } as const;
