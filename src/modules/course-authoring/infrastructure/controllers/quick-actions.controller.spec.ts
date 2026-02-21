import { QuickActionsController } from './quick-actions.controller';
import type { GenerateModuleUseCase } from '../../application/use-cases/generate-module.usecase';
import type { ReorderContentUseCase } from '../../application/use-cases/quick-actions/georder-content.usecase';
import type { GenerateAssessmentsUseCase } from '../../application/use-cases/quick-actions/generate-assessments.usecase';

describe('QuickActionsController', () => {
	it('deve retornar 200 com mensagem de sucesso no reorder-content', async () => {
		const generateModuleExecuteMock = jest.fn();
		const generateModuleUseCase = {
			execute: generateModuleExecuteMock,
		} as unknown as GenerateModuleUseCase;

		const reorderContentExecuteMock = jest.fn().mockResolvedValue(undefined);
		const reorderContentUseCase = {
			execute: reorderContentExecuteMock,
		} as unknown as ReorderContentUseCase;
		const generateAssessmentsUseCase = {
			execute: jest.fn().mockResolvedValue(undefined),
		} as unknown as GenerateAssessmentsUseCase;

		const controller = new QuickActionsController(
			generateModuleUseCase,
			reorderContentUseCase,
			generateAssessmentsUseCase
		);

		const response = await controller.reorderContent(
			'9ef13d89-8f89-4b93-aef5-8857756df453',
			{
				id: 'user-1',
			} as any
		);

		expect(reorderContentExecuteMock).toHaveBeenCalledWith(
			'9ef13d89-8f89-4b93-aef5-8857756df453',
			'user-1'
		);
		expect(response).toEqual({ message: 'Conteúdo reordenado com sucesso' });
	});

	it('deve retornar 200 com mensagem de sucesso no generate-assessments', async () => {
		const generateModuleUseCase = {
			execute: jest.fn(),
		} as unknown as GenerateModuleUseCase;
		const reorderContentUseCase = {
			execute: jest.fn(),
		} as unknown as ReorderContentUseCase;
		const generateAssessmentsExecuteMock = jest
			.fn()
			.mockResolvedValue(undefined);
		const generateAssessmentsUseCase = {
			execute: generateAssessmentsExecuteMock,
		} as unknown as GenerateAssessmentsUseCase;

		const controller = new QuickActionsController(
			generateModuleUseCase,
			reorderContentUseCase,
			generateAssessmentsUseCase
		);

		const response = await controller.generateAssessments(
			'9ef13d89-8f89-4b93-aef5-8857756df453',
			{ id: 'user-1' } as any
		);

		expect(generateAssessmentsExecuteMock).toHaveBeenCalledWith(
			'9ef13d89-8f89-4b93-aef5-8857756df453',
			'user-1'
		);
		expect(response).toEqual({ message: 'Avaliações geradas com sucesso' });
	});
});
