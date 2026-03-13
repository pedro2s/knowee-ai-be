import { AssistantToolRegistry } from './assistant-tool.registry';

describe('AssistantToolRegistry', () => {
	let registry: AssistantToolRegistry;

	beforeEach(() => {
		registry = new AssistantToolRegistry();
	});

	it('deve validar payload sem course_id usando o courseId do contexto', () => {
		expect(
			registry.validateToolCall(
				{
					name: 'create_module',
					arguments: {
						module: {
							title: 'Conversacao Pratica',
							description: 'Descricao',
							order_index: 6,
							lessons: [],
						},
					},
				},
				{ courseId: 'course-1' }
			)
		).toEqual({
			success: true,
			invocation: {
				name: 'create_module',
				rawArguments: {
					module: {
						title: 'Conversacao Pratica',
						description: 'Descricao',
						order_index: 6,
						lessons: [],
					},
				},
				normalizedArguments: {
					courseId: 'course-1',
					title: 'Conversacao Pratica',
					description: 'Descricao',
					orderIndex: 6,
					lessons: [],
				},
			},
		});
	});

	it('deve rejeitar course_id divergente', () => {
		expect(
			registry.validateToolCall(
				{
					name: 'create_module',
					arguments: {
						module: {
							title: 'Conversacao Pratica',
							order_index: 6,
							course_id: 'other-course',
							lessons: [],
						},
					},
				},
				{ courseId: 'course-1' }
			)
		).toEqual({
			success: false,
			error:
				'O course_id informado pela ferramenta não corresponde ao curso atual.',
		});
	});

	it('deve retornar erro especifico quando faltar lesson_type', () => {
		expect(
			registry.validateToolCall(
				{
					name: 'create_module',
					arguments: {
						module: {
							title: 'Conversacao Pratica',
							order_index: 6,
							lessons: [{ title: 'Aula 1' }],
						},
					},
				},
				{ courseId: 'course-1' }
			)
		).toEqual({
			success: false,
			error:
				'O campo module.lessons.0.lesson_type é obrigatório e deve usar um destes valores exatos: video, audio, quiz, pdf, external, article.',
		});
	});
});
