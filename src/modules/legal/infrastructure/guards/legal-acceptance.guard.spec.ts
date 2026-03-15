import { ExecutionContext } from '@nestjs/common';
import { LegalAcceptanceGuard } from './legal-acceptance.guard';
import type { CheckCurrentLegalAcceptanceUseCase } from '../../application/use-cases/check-current-legal-acceptance.usecase';

describe('LegalAcceptanceGuard', () => {
	it('deve permitir quando o usuario ja aceitou o termo atual', async () => {
		const checkCurrentLegalAcceptanceUseCase = {
			execute: jest.fn().mockResolvedValue(true),
		} as unknown as jest.Mocked<CheckCurrentLegalAcceptanceUseCase>;

		const guard = new LegalAcceptanceGuard(checkCurrentLegalAcceptanceUseCase);
		const context = {
			switchToHttp: () => ({
				getRequest: () => ({
					user: { id: 'user-1' },
				}),
			}),
		} as ExecutionContext;

		await expect(guard.canActivate(context)).resolves.toBe(true);
	});

	it('deve bloquear quando o aceite estiver pendente', async () => {
		const checkCurrentLegalAcceptanceUseCase = {
			execute: jest.fn().mockResolvedValue(false),
		} as unknown as jest.Mocked<CheckCurrentLegalAcceptanceUseCase>;

		const guard = new LegalAcceptanceGuard(checkCurrentLegalAcceptanceUseCase);
		const context = {
			switchToHttp: () => ({
				getRequest: () => ({
					user: { id: 'user-1' },
				}),
			}),
		} as ExecutionContext;

		await expect(guard.canActivate(context)).rejects.toThrow(
			'Voce precisa aceitar a versao atual do Termo de Uso da Knowee para continuar.'
		);
	});
});
