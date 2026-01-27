import { ResponseFormatJSONSchema } from 'openai/resources';

export const analyzeStructureAsObject = {
	type: 'object',
	properties: {
		category: {
			type: 'string',
			description: 'The category under which the course is listed.',
			enum: [
				'Tecnologia',
				'Marketing',
				'Negócios',
				'Design',
				'Idiomas',
				'Saúde e Bem-estar',
				'Finanças',
				'Outros',
			],
		},
		level: {
			type: 'string',
			description:
				'The level of the course (iniciante, intermediario, avancado).',
			enum: ['Iniciante', 'Intermediário', 'Avançado'],
		},
		duration: {
			type: 'string',
			description:
				'The expected duration of the course (1-3h, 4-8h, 1-2semanas, 1mes, 3meses).',
			enum: [
				'1-3 horas',
				'4-8 horas',
				'1-2 semanas',
				'1 mes',
				'3 meses',
				'6+ meses',
			],
		},
		analysis: {
			type: 'object',
			properties: {
				title: {
					type: 'object',
					properties: {
						status: {
							type: 'string',
							description: 'Status of the title analysis',
							enum: ['good', 'bad', 'neutral'],
						},
						message: {
							type: 'string',
							description: 'Message of the title analysis',
						},
					},
					required: ['status', 'message'],
					additionalProperties: false,
				},
				description: {
					type: 'object',
					properties: {
						status: {
							type: 'string',
							description: 'Status of the description analysis',
							enum: ['good', 'bad', 'neutral'],
						},
						message: {
							type: 'string',
							description: 'Message of the description analysis',
						},
					},
					required: ['status', 'message'],
					additionalProperties: false,
				},
			},
			required: ['title', 'description'],
			additionalProperties: false,
		},
	},
	required: ['category', 'level', 'duration', 'analysis'],
	additionalProperties: false,
};

export const scriptSectionsStructure: ResponseFormatJSONSchema = {
	type: 'json_schema',
	json_schema: {
		name: 'analyze_structure',
		strict: true,
		schema: analyzeStructureAsObject,
	},
};
