import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import {
	AssistantToolCall,
	AssistantToolDefinition,
} from '../../domain/entities/assistant-tool.types';
import { CreateModuleTreeInput } from 'src/modules/course-authoring/application/use-cases/create-module-tree.usecase';

export interface AssistantToolInvocation {
	name: 'create_module';
	rawArguments: Record<string, unknown>;
	normalizedArguments: CreateModuleTreeInput;
}

interface AssistantToolValidationContext {
	courseId: string;
}

const lessonTypeSchema = z.enum([
	'video',
	'audio',
	'quiz',
	'pdf',
	'external',
	'article',
]);

const lessonTypeValues = lessonTypeSchema.options.join(', ');

const createModuleSchema = z.object({
	module: z
		.object({
			title: z.string().min(1),
			description: z.string().optional().default(''),
			order_index: z.number().int(),
			course_id: z.string().min(1).optional(),
			lessons: z
				.array(
					z.object({
						title: z.string().min(1),
						description: z.string().optional().default(''),
						order_index: z.number().int().optional(),
						lesson_type: lessonTypeSchema,
					})
				)
				.default([]),
		})
		.strict(),
});

@Injectable()
export class AssistantToolRegistry {
	private readonly definitions: AssistantToolDefinition[] = [
		{
			name: 'create_module',
			description:
				'Cria um novo modulo no curso atual com aulas opcionais. Use esta ferramenta quando o usuario pedir explicitamente para criar um modulo e os dados do modulo e das aulas ja puderem ser inferidos da conversa. O courseId e fornecido pelo servidor; nao invente course_id.',
			parameters: {
				type: 'object',
				properties: {
					module: {
						type: 'object',
						description:
							'Dados do modulo a ser criado no curso atual. Nao inclua course_id a menos que queira repetir exatamente o mesmo id do curso atual.',
						properties: {
							title: {
								type: 'string',
								description:
									'Titulo do modulo. Exemplo: "Conversacao Pratica".',
							},
							description: {
								type: 'string',
								description: 'Descricao curta do modulo em texto simples.',
							},
							order_index: {
								type: 'integer',
								description:
									'Ordem numerica do modulo dentro do curso. Exemplo: 6.',
							},
							course_id: {
								type: 'string',
								description:
									'Campo opcional e normalmente desnecessario. O servidor injeta o curso atual.',
							},
							lessons: {
								type: 'array',
								description:
									'Lista de aulas do modulo. Cada aula deve informar titulo, tipo e opcionalmente descricao e ordem.',
								items: {
									type: 'object',
									properties: {
										title: {
											type: 'string',
											description:
												'Titulo da aula. Exemplo: "Role-Play - No Restaurante".',
										},
										description: {
											type: 'string',
											description: 'Descricao breve da aula.',
										},
										order_index: {
											type: 'integer',
											description: 'Ordem numerica da aula dentro do modulo.',
										},
										lesson_type: {
											type: 'string',
											enum: lessonTypeSchema.options,
											description: `Tipo da aula. Use exatamente um destes valores: ${lessonTypeValues}.`,
										},
									},
									required: ['title', 'lesson_type'],
									additionalProperties: false,
								},
							},
						},
						required: ['title', 'order_index', 'lessons'],
						additionalProperties: false,
					},
				},
				required: ['module'],
				additionalProperties: false,
			},
		},
	];

	getDefinitions(): AssistantToolDefinition[] {
		return this.definitions;
	}

	validateToolCall(
		toolCall: AssistantToolCall,
		context: AssistantToolValidationContext
	):
		| { success: true; invocation: AssistantToolInvocation }
		| {
				success: false;
				error: string;
		  } {
		if (toolCall.name !== 'create_module') {
			return {
				success: false,
				error: `Ferramenta não suportada: ${toolCall.name}`,
			};
		}

		const parsed = createModuleSchema.safeParse(toolCall.arguments);
		if (!parsed.success) {
			const issue = parsed.error.issues[0];
			const fieldPath = issue?.path?.join('.') || 'module';
			return {
				success: false,
				error: this.buildValidationErrorMessage(fieldPath, issue?.message),
			};
		}

		const { module } = parsed.data;
		if (module.course_id && module.course_id !== context.courseId) {
			return {
				success: false,
				error:
					'O course_id informado pela ferramenta não corresponde ao curso atual.',
			};
		}

		return {
			success: true,
			invocation: {
				name: 'create_module',
				rawArguments: toolCall.arguments,
				normalizedArguments: {
					courseId: context.courseId,
					title: module.title,
					description: module.description,
					orderIndex: module.order_index,
					lessons: module.lessons.map((lesson, index) => ({
						title: lesson.title,
						description: lesson.description,
						orderIndex: lesson.order_index ?? index + 1,
						lessonType: lesson.lesson_type,
						content: {},
					})),
				},
			},
		};
	}

	private buildValidationErrorMessage(
		fieldPath: string,
		issueMessage?: string
	): string {
		if (fieldPath.includes('lesson_type')) {
			return `O campo ${fieldPath} é obrigatório e deve usar um destes valores exatos: ${lessonTypeValues}.`;
		}

		if (fieldPath.includes('title')) {
			return `O campo ${fieldPath} é obrigatório para criar o módulo ou a aula.`;
		}

		if (fieldPath.includes('order_index')) {
			return `O campo ${fieldPath} é obrigatório e deve ser um número inteiro.`;
		}

		return `Os argumentos recebidos para create_module são inválidos no campo ${fieldPath}${issueMessage ? `: ${issueMessage}` : '.'}`;
	}
}
