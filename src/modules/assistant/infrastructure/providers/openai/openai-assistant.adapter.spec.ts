import { OpenAIAssistantAdapter } from './openai-assistant.adapter';

describe('OpenAIAssistantAdapter', () => {
	it('deve enviar tools e retornar tool call estruturada', async () => {
		const create = jest.fn().mockResolvedValue({
			choices: [
				{
					message: {
						content: '',
						tool_calls: [
							{
								type: 'function',
								function: {
									name: 'create_module',
									arguments:
										'{"module":{"title":"M1","order_index":1,"course_id":"course-1","lessons":[]}}',
								},
							},
						],
					},
				},
			],
			usage: { total_tokens: 15 },
		});
		const adapter = new OpenAIAssistantAdapter({
			chat: { completions: { create } },
		} as never);

		await expect(
			adapter.ask({
				input: { question: 'Crie um módulo' },
				summary: null,
				recentHistory: [],
				tools: [
					{
						name: 'create_module',
						description: 'Cria modulo',
						parameters: { type: 'object' },
					},
				],
			})
		).resolves.toEqual({
			content: {
				answer: '',
				toolCall: {
					name: 'create_module',
					arguments: {
						module: {
							title: 'M1',
							order_index: 1,
							course_id: 'course-1',
							lessons: [],
						},
					},
				},
			},
			tokenUsage: expect.objectContaining({
				totalTokens: 15,
				model: 'gpt-4o-mini',
				provider: 'openai',
				operation: 'assistant.submit_question',
				modality: 'text',
				unitType: 'tokens',
				billableUnits: 15,
				totalUnits: 15,
				metadata: {
					hasToolCall: true,
				},
			}),
		});

		expect(create).toHaveBeenCalledWith(
			expect.objectContaining({
				model: 'gpt-4o-mini',
				tool_choice: 'auto',
				messages: expect.arrayContaining([
					expect.objectContaining({
						role: 'system',
						content: expect.stringContaining(
							'chame a ferramenta create_module'
						),
					}),
				]),
				tools: expect.arrayContaining([
					expect.objectContaining({
						type: 'function',
					}),
				]),
			})
		);
	});

	it('deve retornar resposta simples quando nao houver tool call', async () => {
		const create = jest.fn().mockResolvedValue({
			choices: [{ message: { content: 'Resposta simples' } }],
			usage: { total_tokens: 9 },
		});
		const adapter = new OpenAIAssistantAdapter({
			chat: { completions: { create } },
		} as never);

		await expect(
			adapter.ask({
				input: { question: 'Oi' },
				summary: null,
				recentHistory: [],
				tools: [],
			})
		).resolves.toEqual({
			content: { answer: 'Resposta simples', toolCall: undefined },
			tokenUsage: expect.objectContaining({
				totalTokens: 9,
				model: 'gpt-4o-mini',
				provider: 'openai',
				operation: 'assistant.submit_question',
				modality: 'text',
				unitType: 'tokens',
				billableUnits: 9,
				totalUnits: 9,
				metadata: {
					hasToolCall: false,
				},
			}),
		});
	});
});
