import { sql } from 'drizzle-orm';
import { DrizzleRlsContext } from './drizzle-rls.context';

describe('DrizzleRlsContext', () => {
	it('executes the RLS session setup when userId is valid', async () => {
		const execute = jest.fn().mockResolvedValue(undefined);
		const tx = { execute };
		const transaction = jest
			.fn()
			.mockImplementation((callback: (db: unknown) => Promise<string>) =>
				callback(tx)
			);
		const drizzle = {
			db: {
				transaction,
			},
		} as any;

		const context = new DrizzleRlsContext(drizzle);
		const fn = jest.fn().mockResolvedValue('ok');

		await expect(
			context.runAsUser({ userId: ' user-1 ', role: 'authenticated' }, fn)
		).resolves.toBe('ok');

		expect(transaction).toHaveBeenCalledTimes(1);
		expect(execute).toHaveBeenCalledTimes(1);
		expect(execute.mock.calls[0]?.[0]).toEqual(
			sql`select set_config('request.jwt.claim.sub', ${'user-1'}, true), set_config('request.jwt.claim.role', ${'authenticated'}, true)`
		);
		expect(fn).toHaveBeenCalledWith(tx);
	});

	it('fails early when userId is empty', async () => {
		const execute = jest.fn();
		const transaction = jest.fn();
		const drizzle = {
			db: {
				transaction,
			},
		} as any;

		const context = new DrizzleRlsContext(drizzle);
		const fn = jest.fn();

		await expect(
			context.runAsUser({ userId: '   ', role: 'authenticated' }, fn)
		).rejects.toThrow('Invalid AuthContext: userId is required for runAsUser');

		expect(transaction).not.toHaveBeenCalled();
		expect(execute).not.toHaveBeenCalled();
		expect(fn).not.toHaveBeenCalled();
	});
});
