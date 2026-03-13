import { SignUpUseCase } from './sign-up.usecase';
import type { AuthServicePort } from '../../domain/ports/auth.service.port';
import type { CreateFreeSubscriptionUseCase } from 'src/modules/billing/application/use-cases/create-free-subscription.usecase';

describe('SignUpUseCase', () => {
	it('deve criar a assinatura gratuita usando o e-mail retornado pelo authService', async () => {
		const authService = {
			signUp: jest.fn().mockResolvedValue({
				user: {
					id: 'user-1',
					email: 'persisted@example.com',
					role: 'authenticated',
				},
			}),
		} as unknown as jest.Mocked<AuthServicePort>;
		const createFreeSubscriptionUseCase = {
			execute: jest.fn().mockResolvedValue(undefined),
		} as unknown as jest.Mocked<CreateFreeSubscriptionUseCase>;

		const useCase = new SignUpUseCase(
			authService,
			createFreeSubscriptionUseCase
		);

		const dto = {
			email: 'input@example.com',
			password: 'secret',
			name: 'User',
		};

		await expect(useCase.execute(dto)).resolves.toEqual({
			user: {
				id: 'user-1',
				email: 'persisted@example.com',
				role: 'authenticated',
			},
		});
		expect(createFreeSubscriptionUseCase.execute).toHaveBeenCalledWith(
			'user-1',
			'persisted@example.com'
		);
	});

	it('deve usar o e-mail do dto quando o authService nao retornar email', async () => {
		const authService = {
			signUp: jest.fn().mockResolvedValue({
				user: {
					id: 'user-1',
					email: null,
					role: 'authenticated',
				},
			}),
		} as unknown as jest.Mocked<AuthServicePort>;
		const createFreeSubscriptionUseCase = {
			execute: jest.fn().mockResolvedValue(undefined),
		} as unknown as jest.Mocked<CreateFreeSubscriptionUseCase>;

		const useCase = new SignUpUseCase(
			authService,
			createFreeSubscriptionUseCase
		);

		await useCase.execute({
			email: 'input@example.com',
			password: 'secret',
			name: 'User',
		});

		expect(createFreeSubscriptionUseCase.execute).toHaveBeenCalledWith(
			'user-1',
			'input@example.com'
		);
	});
});
