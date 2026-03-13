import { ChangePasswordUseCase } from './change-password.usecase';
import type { AuthServicePort } from '../../domain/ports/auth.service.port';

describe('ChangePasswordUseCase', () => {
	it('deve mapear o dto para o authService', async () => {
		const authService = {
			changePassword: jest.fn().mockResolvedValue(undefined),
		} as unknown as jest.Mocked<AuthServicePort>;

		const useCase = new ChangePasswordUseCase(authService);

		await expect(
			useCase.execute({
				userId: 'user-1',
				email: 'user@example.com',
				dto: {
					currentPassword: 'old-pass',
					newPassword: 'new-pass',
				},
			})
		).resolves.toBeUndefined();
		expect(authService.changePassword).toHaveBeenCalledWith({
			userId: 'user-1',
			email: 'user@example.com',
			currentPassword: 'old-pass',
			newPassword: 'new-pass',
		});
	});
});
