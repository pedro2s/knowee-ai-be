import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import type { ConfigService } from '@nestjs/config';

describe('JwtStrategy', () => {
	it('deve falhar quando JWT_SECRET nao estiver definido', () => {
		const configService = {
			get: jest.fn().mockReturnValue(undefined),
		} as unknown as jest.Mocked<ConfigService>;

		expect(() => new JwtStrategy(configService)).toThrow(
			'JWT_SECRET is not defined'
		);
	});

	it('deve validar e mapear o payload para UserPayload', () => {
		const configService = {
			get: jest.fn().mockReturnValue('jwt-secret'),
		} as unknown as jest.Mocked<ConfigService>;

		const strategy = new JwtStrategy(configService);

		expect(
			strategy.validate({
				sub: 'user-1',
				email: 'user@example.com',
				role: 'authenticated',
			})
		).toEqual({
			id: 'user-1',
			email: 'user@example.com',
			role: 'authenticated',
		});
	});

	it('deve rejeitar payload invalido', () => {
		const configService = {
			get: jest.fn().mockReturnValue('jwt-secret'),
		} as unknown as jest.Mocked<ConfigService>;

		const strategy = new JwtStrategy(configService);

		expect(() =>
			strategy.validate({
				sub: '',
				email: '',
				role: 'authenticated',
			})
		).toThrow(UnauthorizedException);
	});
});
