import { ResponseFormatJSONSchema } from 'openai/resources';

export const moduleStructureSchemaAsObject = {
	type: 'object',
	description: 'The module to be added into the course.',
	properties: {
		title: {
			type: 'string',
			description: 'The title of the module.',
		},
		description: {
			type: 'string',
			description: 'A brief description of the module.',
		},
		orderIndex: {
			type: 'integer',
			description: 'Index representing the order of this module.',
		},
		lessons: {
			type: 'array',
			description: 'A list of lessons in the module.',
			items: {
				type: 'object',
				properties: {
					title: {
						type: 'string',
						description: 'The title of the lesson.',
					},
					description: {
						type: 'string',
						description: 'A brief description of the lesson.',
					},
					orderIndex: {
						type: 'integer',
						description: 'Index representing the order of this lesson.',
					},
					lessonType: {
						type: 'string',
						description:
							'The type of lesson (video, audio, quiz, pdf, external, article).',
						enum: ['video', 'audio', 'quiz', 'pdf', 'external', 'article'],
					},
				},
				required: ['title', 'description', 'orderIndex', 'lessonType'],
				additionalProperties: false,
			},
		},
	},
	required: ['title', 'description', 'orderIndex', 'lessons'],
	additionalProperties: false,
};

export const moduleStructure: ResponseFormatJSONSchema = {
	type: 'json_schema',
	json_schema: {
		name: 'module_structure',
		strict: true,
		schema: moduleStructureSchemaAsObject,
	},
};
