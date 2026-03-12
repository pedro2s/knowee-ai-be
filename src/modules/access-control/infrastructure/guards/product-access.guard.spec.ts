import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProductAccessGuard } from './product-access.guard';
import type { CheckAccessUseCase } from '../../application/use-cases/check-access.usecase';

describe('ProductAccessGuard', () => {
	function buildContext(req: Record<string, unknown>) {
		return {
			getHandler: jest.fn(),
			getClass: jest.fn(),
			switchToHttp: () => ({
				getRequest: () => req,
			}),
		} as never;
	}

	it('deve permitir quando nao houver requirement', async () => {
		const reflector = {
			getAllAndOverride: jest.fn().mockReturnValue(undefined),
		} as unknown as jest.Mocked<Reflector>;
		const checkAccessUseCase = {
			execute: jest.fn(),
		} as unknown as jest.Mocked<CheckAccessUseCase>;
		const guard = new ProductAccessGuard(reflector, checkAccessUseCase);

		await expect(guard.canActivate(buildContext({}))).resolves.toBe(true);
		expect(checkAccessUseCase.execute).not.toHaveBeenCalled();
	});

	it('deve negar quando nao houver usuario autenticado', async () => {
		const reflector = {
			getAllAndOverride: jest.fn().mockReturnValue({
				action: 'ai.interaction',
				params: {},
			}),
		} as unknown as jest.Mocked<Reflector>;
		const guard = new ProductAccessGuard(reflector, {
			execute: jest.fn(),
		} as unknown as CheckAccessUseCase);

		await expect(
			guard.canActivate(buildContext({ body: {}, params: {} }))
		).resolves.toBe(false);
	});

	it('deve encaminhar o contexto resolvido ao use case', async () => {
		const reflector = {
			getAllAndOverride: jest.fn().mockReturnValue({
				action: 'ai.interaction',
				params: { courseIdBody: 'courseId' },
			}),
		} as unknown as jest.Mocked<Reflector>;
		const checkAccessUseCase = {
			execute: jest.fn().mockResolvedValue({ allowed: true }),
		} as unknown as jest.Mocked<CheckAccessUseCase>;
		const guard = new ProductAccessGuard(reflector, checkAccessUseCase);

		await expect(
			guard.canActivate(
				buildContext({
					user: { id: 'user-1' },
					body: { courseId: 'course-1' },
					params: {},
				})
			)
		).resolves.toBe(true);
		expect(checkAccessUseCase.execute).toHaveBeenCalledWith({
			userId: 'user-1',
			action: 'ai.interaction',
			context: {
				courseId: 'course-1',
				moduleId: undefined,
				lessonId: undefined,
			},
		});
	});

	it('deve lançar ForbiddenException quando acesso for negado', async () => {
		const reflector = {
			getAllAndOverride: jest.fn().mockReturnValue({
				action: 'course.read',
				params: {},
			}),
		} as unknown as jest.Mocked<Reflector>;
		const checkAccessUseCase = {
			execute: jest.fn().mockResolvedValue({
				allowed: false,
				reasonCode: 'SUBSCRIPTION_REQUIRED',
				message: 'Upgrade required',
				upgradeRequired: true,
				nextStep: 'open_subscription_settings',
			}),
		} as unknown as jest.Mocked<CheckAccessUseCase>;
		const guard = new ProductAccessGuard(reflector, checkAccessUseCase);

		await expect(
			guard.canActivate(
				buildContext({
					user: { id: 'user-1' },
					body: {},
					params: { id: 'course-1' },
				})
			)
		).rejects.toThrow(ForbiddenException);
	});
});
