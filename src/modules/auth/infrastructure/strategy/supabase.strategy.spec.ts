import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseStrategy } from './supabase.strategy';

describe('SupabaseStrategy', () => {
	it('deve falhar quando SUPABASE_JWT_SECRET nao estiver definido', () => {
		const configService = {
			get: jest.fn().mockReturnValue(undefined),
		} as unknown as jest.Mocked<ConfigService>;
		const supabaseClient = {
			auth: { getUser: jest.fn() },
		} as unknown as jest.Mocked<SupabaseClient>;

		expect(() => new SupabaseStrategy(supabaseClient, configService)).toThrow(
			'SUPABASE_JWT_SECRET is not defined'
		);
	});

	it('deve retornar o usuario do Supabase quando o token for valido', async () => {
		const configService = {
			get: jest.fn().mockReturnValue('supabase-secret'),
		} as unknown as jest.Mocked<ConfigService>;
		const supabaseClient = {
			auth: {
				getUser: jest.fn().mockResolvedValue({
					data: { user: { id: 'user-1' } },
					error: null,
				}),
			},
		} as unknown as jest.Mocked<SupabaseClient>;

		const strategy = new SupabaseStrategy(supabaseClient, configService);

		const request = {
			headers: { authorization: 'Bearer token-123' },
		} as never;

		await expect(
			strategy.validate(request, { sub: 'user-1' })
		).resolves.toEqual({ id: 'user-1' });
		expect(supabaseClient.auth.getUser).toHaveBeenCalledWith('token-123');
	});

	it('deve rejeitar token invalido', async () => {
		const configService = {
			get: jest.fn().mockReturnValue('supabase-secret'),
		} as unknown as jest.Mocked<ConfigService>;
		const supabaseClient = {
			auth: {
				getUser: jest.fn().mockResolvedValue({
					data: { user: null },
					error: new Error('invalid token'),
				}),
			},
		} as unknown as jest.Mocked<SupabaseClient>;

		const strategy = new SupabaseStrategy(supabaseClient, configService);

		await expect(
			strategy.validate(
				{ headers: { authorization: 'Bearer token-123' } } as never,
				{}
			)
		).rejects.toThrow(UnauthorizedException);
	});
});
