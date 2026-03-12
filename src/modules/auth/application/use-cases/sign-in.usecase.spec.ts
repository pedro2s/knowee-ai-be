import { SignInUseCase } from './sign-in.usecase';
import type { AuthServicePort } from '../../domain/ports/auth.service.port';

describe('SignInUseCase', () => {
	it('deve delegar o login para o authService', async () => {
		const authService = {
			signIn: jest.fn().mockResolvedValue({
				access_token: 'access-token',
				refresh_token: 'refresh-token',
			}),
		} as unknown as jest.Mocked<AuthServicePort>;

		const useCase = new SignInUseCase(authService);

		await expect(
			useCase.execute({
				email: 'user@example.com',
				password: 'secret',
			})
		).resolves.toEqual({
			access_token: 'access-token',
			refresh_token: 'refresh-token',
		});
		expect(authService.signIn).toHaveBeenCalledWith({
			email: 'user@example.com',
			password: 'secret',
		});
	});

	it('deve propagar erros do authService', async () => {
		const error = new Error('invalid credentials');
		const authService = {
			signIn: jest.fn().mockRejectedValue(error),
		} as unknown as jest.Mocked<AuthServicePort>;

		const useCase = new SignInUseCase(authService);

		await expect(
			useCase.execute({
				email: 'user@example.com',
				password: 'secret',
			})
		).rejects.toThrow(error);
	});
});
