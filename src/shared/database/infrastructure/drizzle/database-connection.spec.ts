import {
	buildDrizzleConfig,
	buildPgPoolConfig,
	normalizeDatabaseUrl,
} from './database-connection';

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
			host: 'db.internal',
			port: 5432,
			user: 'user',
			password: 'secret',
			database: 'knowee',
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
			host: 'db.internal',
			port: 5432,
			user: 'user',
			password: 'secret',
			database: 'knowee',
			ssl: {
				rejectUnauthorized: true,
				ca: 'line1\nline2',
			},
		});
	});

	it('prioriza validacao de certificado quando a CA e fornecida', () => {
		expect(
			buildPgPoolConfig(
				'postgresql://user:secret@db.internal:5432/knowee?sslmode=require',
				{
					DATABASE_SSL_CA: 'line1\\nline2',
					DATABASE_SSL_REJECT_UNAUTHORIZED: 'false',
				} as NodeJS.ProcessEnv
			)
		).toEqual({
			host: 'db.internal',
			port: 5432,
			user: 'user',
			password: 'secret',
			database: 'knowee',
			ssl: {
				rejectUnauthorized: true,
				ca: 'line1\nline2',
			},
		});
	});

	it('nao retorna connectionString no runtime quando ssl esta ativo', () => {
		expect(
			buildPgPoolConfig(
				'postgresql://user:secret@db.internal:5432/knowee?sslmode=require',
				{} as NodeJS.ProcessEnv
			)
		).not.toHaveProperty('connectionString');
	});

	it('gera credenciais do drizzle com ssl explicito quando necessario', () => {
		expect(
			buildDrizzleConfig(
				'postgresql://user%40mail:sec%3Aret@db.internal:5432/knowee?sslmode=require',
				{
					DATABASE_SSL_CA: 'line1\\nline2',
				} as NodeJS.ProcessEnv
			)
		).toEqual({
			host: 'db.internal',
			port: 5432,
			user: 'user@mail',
			password: 'sec:ret',
			database: 'knowee',
			ssl: {
				rejectUnauthorized: true,
				ca: 'line1\nline2',
			},
		});
	});
});
