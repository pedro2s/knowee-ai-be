import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const analysisSchema = z.object({
	title: z.object({
		status: z
			.enum(['good', 'bad', 'neutral'])
			.describe('Status of the title analysis'),
		message: z.string().optional().describe('Message of the title analysis'),
	}),
	description: z.object({
		status: z
			.enum(['good', 'bad', 'neutral'])
			.describe('Status of the description analysis'),
		message: z
			.string()
			.optional()
			.describe('Message of the description analysis'),
	}),
});

export const analyzeSchema = z.object({
	category: z
		.enum([
			'Tecnologia',
			'Marketing',
			'Negócios',
			'Design',
			'Idiomas',
			'Saúde e Bem-estar',
			'Finanças',
			'Outros',
		])
		.optional()
		.describe('The category under which the course is listed.'),
	level: z
		.enum(['Iniciante', 'Intermediário', 'Avançado'])
		.optional()
		.describe(
			'The level of the course: Iniciante (beginner), Intermediário (intermediate), Avançado (advanced).'
		),
	duration: z
		.enum([
			'1-3 horas',
			'4-8 horas',
			'1-2 semanas',
			'1 mes',
			'3 meses',
			'6+ meses',
		])
		.optional()
		.describe(
			'The expected duration of the course: 1-3 horas (1-3 hours), 4-8 horas (4-8 hours), 1-2 semanas (1-2 weeks), 1 mes (1 month), 3 meses (3 months), 6+ meses (6+ months).'
		),
	analysis: analysisSchema,
});

export const analyzeStructure = {
	type: 'OBJECT',
	properties: {
		category: {
			type: 'STRING',
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
			nullable: true,
		},
		level: {
			type: 'STRING',
			description:
				'The level of the course: Iniciante (beginner), Intermediário (intermediate), Avançado (advanced).',
			enum: ['Iniciante', 'Intermediário', 'Avançado'],
			nullable: true,
		},
		duration: {
			type: 'STRING',
			description:
				'The expected duration of the course: 1-3 horas (1-3 hours), 4-8 horas (4-8 hours), 1-2 semanas (1-2 weeks), 1 mes (1 month), 3 meses (3 months), 6+ meses (6+ months).',
			enum: [
				'1-3 horas',
				'4-8 horas',
				'1-2 semanas',
				'1 mes',
				'3 meses',
				'6+ meses',
			],
			nullable: true,
		},
		analysis: {
			type: 'OBJECT',
			properties: {
				title: {
					type: 'OBJECT',
					properties: {
						status: {
							type: 'STRING',
							description: 'Status of the title analysis',
							enum: ['good', 'bad', 'neutral'],
						},
						message: {
							type: 'STRING',
							description: 'Message of the title analysis',
						},
					},
					required: ['status', 'message'],
					additionalProperties: false,
				},
				description: {
					type: 'OBJECT',
					properties: {
						status: {
							type: 'STRING',
							description: 'Status of the description analysis',
							enum: ['good', 'bad', 'neutral'],
							nullable: true,
						},
						message: {
							type: 'STRING',
							description: 'Message of the description analysis',
							nullable: true,
						},
					},
					required: [],
					additionalProperties: false,
					nullable: true,
				},
			},
			required: ['title'],
			additionalProperties: false,
		},
	},
	required: ['analysis'],
	additionalProperties: false,
};
