import type { PoolConfig } from 'pg';

const SSL_REQUIRED_MODES = new Set(['require', 'verify-ca', 'verify-full']);
const SSL_VERIFY_MODES = new Set(['verify-ca', 'verify-full']);

function stripWrappingQuotes(value: string): string {
	const trimmed = value.trim();
	if (
		(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'"))
	) {
		return trimmed.slice(1, -1);
	}

	return trimmed;
}

function parseBooleanFlag(value: string | undefined): boolean | undefined {
	if (!value) {
		return undefined;
	}

	const normalized = value.trim().toLowerCase();

	if (['1', 'true', 'yes', 'on'].includes(normalized)) {
		return true;
	}

	if (['0', 'false', 'no', 'off'].includes(normalized)) {
		return false;
	}

	return undefined;
}

function safeParseDatabaseUrl(databaseUrl: string): URL | undefined {
	try {
		return new URL(databaseUrl);
	} catch {
		return undefined;
	}
}

function shouldRequireSsl(env: NodeJS.ProcessEnv): boolean {
	return (
		parseBooleanFlag(env.DATABASE_REQUIRE_SSL) === true ||
		parseBooleanFlag(env.DATABASE_SSL) === true
	);
}

export function normalizeDatabaseUrl(
	rawDatabaseUrl: string,
	env: NodeJS.ProcessEnv = process.env
): string {
	const databaseUrl = stripWrappingQuotes(rawDatabaseUrl);
	const parsed = safeParseDatabaseUrl(databaseUrl);

	if (!parsed) {
		return databaseUrl;
	}

	if (!parsed.searchParams.has('sslmode') && shouldRequireSsl(env)) {
		parsed.searchParams.set('sslmode', 'require');
	}

	return parsed.toString();
}

export function buildPgPoolConfig(
	rawDatabaseUrl: string,
	env: NodeJS.ProcessEnv = process.env
): Pick<PoolConfig, 'connectionString' | 'ssl'> {
	const connectionString = normalizeDatabaseUrl(rawDatabaseUrl, env);
	const ssl = buildSslConfig(connectionString, env);

	if (!ssl) {
		return { connectionString };
	}

	return {
		connectionString,
		ssl,
	};
}

export function buildDrizzleConfig(
	rawDatabaseUrl: string,
	env: NodeJS.ProcessEnv = process.env
) {
	const connectionString = normalizeDatabaseUrl(rawDatabaseUrl, env);
	const parsed = safeParseDatabaseUrl(connectionString);
	const ssl = buildSslConfig(connectionString, env);

	if (!parsed || !ssl) {
		return { url: connectionString };
	}

	return {
		host: parsed.hostname,
		port: parsed.port ? Number(parsed.port) : 5432,
		user: decodeURIComponent(parsed.username),
		password: decodeURIComponent(parsed.password),
		database: parsed.pathname.replace(/^\//, ''),
		ssl,
	};
}

function buildSslConfig(
	connectionString: string,
	env: NodeJS.ProcessEnv
): PoolConfig['ssl'] | undefined {
	const parsed = safeParseDatabaseUrl(connectionString);
	const sslMode = parsed?.searchParams.get('sslmode')?.toLowerCase();
	const rejectUnauthorizedOverride = parseBooleanFlag(
		env.DATABASE_SSL_REJECT_UNAUTHORIZED
	);
	const shouldUseSsl =
		SSL_REQUIRED_MODES.has(sslMode ?? '') ||
		(sslMode == null && shouldRequireSsl(env));

	if (!shouldUseSsl) {
		return undefined;
	}

	const ssl: NonNullable<PoolConfig['ssl']> = {
		rejectUnauthorized:
			env.DATABASE_SSL_CA != null && env.DATABASE_SSL_CA !== ''
				? true
				: (rejectUnauthorizedOverride ?? SSL_VERIFY_MODES.has(sslMode ?? '')),
	};

	if (env.DATABASE_SSL_CA) {
		ssl.ca = env.DATABASE_SSL_CA.replace(/\\n/g, '\n');
	}

	return ssl;
}
