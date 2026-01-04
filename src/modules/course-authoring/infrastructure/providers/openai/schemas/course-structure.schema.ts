import { ResponseFormatJSONSchema } from 'openai/resources';

export const courseStructureSchemaAsObject = {
	type: 'object',
	properties: {
		title: {
			type: 'string',
			description: 'The title of the course.',
		},
		description: {
			type: 'string',
			description: 'A brief description of the course.',
		},
		category: {
			type: 'string',
			description: 'The category under which the course is listed.',
		},
		level: {
			type: 'string',
			description:
				'The level of the course (iniciante, intermediario, avancado).',
			enum: ['iniciante', 'intermediario', 'avancado'],
		},
		duration: {
			type: 'string',
			description:
				'The expected duration of the course (1-3h, 4-8h, 1-2semanas, 1mes, 3meses, 6meses).',
			enum: ['1-3h', '4-8h', '1-2semanas', '1mes', '3meses', '6meses'],
		},
		targetAudience: {
			type: 'string',
			description: 'The intended audience for the course.',
		},
		objectives: {
			type: 'string',
			description: 'The objectives that the course aims to achieve.',
		},
		modules: {
			type: 'array',
			description: 'A list of modules included in the course.',
			items: {
				type: 'object',
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
						description:
							'Index representing the order of this module.',
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
									description:
										'A brief description of the lesson.',
								},
								orderIndex: {
									type: 'integer',
									description:
										'Index representing the order of this lesson.',
								},
								lessonType: {
									type: 'string',
									description:
										'The type of lesson (video, audio, quiz, pdf, external, article).',
									enum: [
										'video',
										'audio',
										'quiz',
										'pdf',
										'external',
										'article',
									],
								},
							},
							required: [
								'title',
								'description',
								'orderIndex',
								'lessonType',
							],
							additionalProperties: false,
						},
					},
				},
				required: ['title', 'description', 'orderIndex', 'lessons'],
				additionalProperties: false,
			},
		},
	},
	required: [
		'title',
		'description',
		'category',
		'level',
		'duration',
		'targetAudience',
		'objectives',
		'modules',
	],
	additionalProperties: false,
};

export const courseStructure: ResponseFormatJSONSchema = {
	type: 'json_schema',
	json_schema: {
		name: 'course_structure',
		strict: true,
		schema: courseStructureSchemaAsObject,
	},
};
