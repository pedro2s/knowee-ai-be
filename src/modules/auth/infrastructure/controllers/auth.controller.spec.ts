import { AuthController } from './auth.controller';
import type { SignInUseCase } from '../../application/use-cases/sign-in.usecase';
import type { SignUpUseCase } from '../../application/use-cases/sign-up.usecase';
import type { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.usecase';
import type { ChangePasswordUseCase } from '../../application/use-cases/change-password.usecase';

describe('AuthController', () => {
	const user = {
		id: 'user-1',
		email: 'user@example.com',
		role: 'authenticated',
	} as const;

	it('deve encaminhar signIn para o use case', async () => {
		const signInUseCase = {
			execute: jest
				.fn()
				.mockResolvedValue({ access_token: 'a', refresh_token: 'r' }),
		} as unknown as jest.Mocked<SignInUseCase>;
		const controller = new AuthController(
			signInUseCase,
			{ execute: jest.fn() } as unknown as SignUpUseCase,
			{ execute: jest.fn() } as unknown as RefreshTokenUseCase,
			{ execute: jest.fn() } as unknown as ChangePasswordUseCase
		);

		await expect(
			controller.signIn({ email: 'user@example.com', password: 'secret' })
		).resolves.toEqual({ access_token: 'a', refresh_token: 'r' });
		expect(signInUseCase.execute).toHaveBeenCalledWith({
			email: 'user@example.com',
			password: 'secret',
		});
	});

	it('deve encaminhar signUp e refresh para os respectivos use cases', async () => {
		const signUpUseCase = {
			execute: jest.fn().mockResolvedValue({ user }),
		} as unknown as jest.Mocked<SignUpUseCase>;
		const refreshTokenUseCase = {
			execute: jest
				.fn()
				.mockResolvedValue({ access_token: 'a', refresh_token: 'r' }),
		} as unknown as jest.Mocked<RefreshTokenUseCase>;
		const controller = new AuthController(
			{ execute: jest.fn() } as unknown as SignInUseCase,
			signUpUseCase,
			refreshTokenUseCase,
			{ execute: jest.fn() } as unknown as ChangePasswordUseCase
		);

		await expect(
			controller.signUp({ email: user.email, password: 'secret', name: 'User' })
		).resolves.toEqual({ user });
		await expect(
			controller.refresh({ refreshToken: 'refresh-123' })
		).resolves.toEqual({ access_token: 'a', refresh_token: 'r' });

		expect(signUpUseCase.execute).toHaveBeenCalledWith({
			email: user.email,
			password: 'secret',
			name: 'User',
		});
		expect(refreshTokenUseCase.execute).toHaveBeenCalledWith({
			refreshToken: 'refresh-123',
		});
	});

	it('deve retornar o usuario atual no profile e mensagem de sucesso em changePassword', async () => {
		const changePasswordUseCase = {
			execute: jest.fn().mockResolvedValue(undefined),
		} as unknown as jest.Mocked<ChangePasswordUseCase>;
		const controller = new AuthController(
			{ execute: jest.fn() } as unknown as SignInUseCase,
			{ execute: jest.fn() } as unknown as SignUpUseCase,
			{ execute: jest.fn() } as unknown as RefreshTokenUseCase,
			changePasswordUseCase
		);

		expect(controller.getProfile(user)).toBe(user);
		await expect(
			controller.changePassword(user, {
				currentPassword: 'old-pass',
				newPassword: 'new-pass',
			})
		).resolves.toEqual({ message: 'Senha alterada com sucesso' });
		expect(changePasswordUseCase.execute).toHaveBeenCalledWith({
			userId: user.id,
			email: user.email,
			dto: {
				currentPassword: 'old-pass',
				newPassword: 'new-pass',
			},
		});
	});
});
