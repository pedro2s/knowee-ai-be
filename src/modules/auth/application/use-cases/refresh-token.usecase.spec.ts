import { RefreshTokenUseCase } from './refresh-token.usecase';
import type { AuthServicePort } from '../../domain/ports/auth.service.port';

describe('RefreshTokenUseCase', () => {
	it('deve delegar o refresh para o authService', async () => {
		const authService = {
			refreshSession: jest.fn().mockResolvedValue({
				access_token: 'access-token',
				refresh_token: 'refresh-token',
			}),
		} as unknown as jest.Mocked<AuthServicePort>;

		const useCase = new RefreshTokenUseCase(authService);

		await expect(
			useCase.execute({ refreshToken: 'refresh-123' })
		).resolves.toEqual({
			access_token: 'access-token',
			refresh_token: 'refresh-token',
		});
		expect(authService.refreshSession).toHaveBeenCalledWith('refresh-123');
	});
});
