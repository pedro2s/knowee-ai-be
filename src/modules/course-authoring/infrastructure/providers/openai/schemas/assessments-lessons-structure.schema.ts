import { ResponseFormatJSONSchema } from 'openai/resources';

export const assessmentsLessonsStructureSchemaAsObject = {
	type: 'object',
	properties: {
		lessons: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					title: {
						type: 'string',
						description: 'Título da avaliação.',
					},
					description: {
						type: 'string',
						description: 'Descrição da avaliação.',
					},
					orderIndex: {
						type: 'integer',
						description: 'Ordem da aula no módulo.',
					},
					moduleId: {
						type: 'string',
						format: 'uuid',
						description: 'ID do módulo vinculado.',
					},
					lessonType: {
						type: 'string',
						enum: ['quiz', 'pdf', 'external'],
						description: 'Tipo da avaliação.',
					},
				},
				required: [
					'title',
					'description',
					'orderIndex',
					'moduleId',
					'lessonType',
				],
				additionalProperties: false,
			},
		},
	},
	required: ['lessons'],
	additionalProperties: false,
};

export const assessmentsLessonsStructure: ResponseFormatJSONSchema = {
	type: 'json_schema',
	json_schema: {
		name: 'assessments_lessons_structure',
		strict: true,
		schema: assessmentsLessonsStructureSchemaAsObject,
	},
};
