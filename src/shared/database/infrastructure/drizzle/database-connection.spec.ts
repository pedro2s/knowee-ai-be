import { buildPgPoolConfig, normalizeDatabaseUrl } from './database-connection';

describe('database connection helpers', () => {
	it('mantem a url original quando ssl nao e exigido', () => {
		const databaseUrl = 'postgresql://user:secret@localhost:5432/knowee';

		expect(normalizeDatabaseUrl(databaseUrl, {} as NodeJS.ProcessEnv)).toBe(
			databaseUrl
		);
		expect(buildPgPoolConfig(databaseUrl, {} as NodeJS.ProcessEnv)).toEqual({
			connectionString: databaseUrl,
		});
	});

	it('adiciona sslmode=require quando o ambiente exige tls', () => {
		const databaseUrl = '"postgresql://user:secret@db.internal:5432/knowee"';

		expect(
			normalizeDatabaseUrl(databaseUrl, {
				DATABASE_REQUIRE_SSL: 'true',
			} as NodeJS.ProcessEnv)
		).toBe('postgresql://user:secret@db.internal:5432/knowee?sslmode=require');
	});

	it('cria config ssl tolerante para sslmode=require', () => {
		expect(
			buildPgPoolConfig(
				'postgresql://user:secret@db.internal:5432/knowee?sslmode=require',
				{} as NodeJS.ProcessEnv
			)
		).toEqual({
			connectionString:
				'postgresql://user:secret@db.internal:5432/knowee?sslmode=require',
			ssl: {
				rejectUnauthorized: false,
			},
		});
	});

	it('mantem validacao de certificado quando sslmode=verify-full', () => {
		expect(
			buildPgPoolConfig(
				'postgresql://user:secret@db.internal:5432/knowee?sslmode=verify-full',
				{
					DATABASE_SSL_CA: 'line1\\nline2',
				} as NodeJS.ProcessEnv
			)
		).toEqual({
			connectionString:
				'postgresql://user:secret@db.internal:5432/knowee?sslmode=verify-full',
			ssl: {
				rejectUnauthorized: true,
				ca: 'line1\nline2',
			},
		});
	});
});
