import { ResponseFormatJSONSchema } from 'openai/resources';

export const quizContentStructureSchemaAsObject = {
	type: 'object',
	properties: {
		quizQuestions: {
			type: 'array',
			minItems: 4,
			maxItems: 4,
			items: {
				type: 'object',
				properties: {
					question: {
						type: 'string',
						description: 'Pergunta clara e específica.',
					},
					options: {
						type: 'array',
						minItems: 4,
						maxItems: 4,
						items: {
							type: 'string',
						},
						description: 'Quatro opções de resposta.',
					},
					correctAnswer: {
						type: 'integer',
						minimum: 0,
						maximum: 3,
						description: 'Índice da resposta correta no array options (0 a 3).',
					},
					explanation: {
						type: 'string',
						description: 'Explicação educativa da resposta correta.',
					},
				},
				required: ['question', 'options', 'correctAnswer', 'explanation'],
				additionalProperties: false,
			},
		},
	},
	required: ['quizQuestions'],
	additionalProperties: false,
};

export const quizContentStructure: ResponseFormatJSONSchema = {
	type: 'json_schema',
	json_schema: {
		name: 'quiz_content_structure',
		strict: true,
		schema: quizContentStructureSchemaAsObject,
	},
};
