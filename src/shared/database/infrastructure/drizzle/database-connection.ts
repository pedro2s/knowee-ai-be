import type { PoolConfig } from 'pg';

const SSL_REQUIRED_MODES = new Set(['require', 'verify-ca', 'verify-full']);

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
	const parsed = safeParseDatabaseUrl(connectionString);
	const sslMode = parsed?.searchParams.get('sslmode')?.toLowerCase();
	const rejectUnauthorizedOverride = parseBooleanFlag(
		env.DATABASE_SSL_REJECT_UNAUTHORIZED
	);
	const shouldUseSsl =
		SSL_REQUIRED_MODES.has(sslMode ?? '') ||
		(sslMode == null && shouldRequireSsl(env));

	if (!shouldUseSsl) {
		return { connectionString };
	}

	const ssl: NonNullable<PoolConfig['ssl']> = {
		rejectUnauthorized:
			rejectUnauthorizedOverride ??
			(sslMode === 'verify-ca' || sslMode === 'verify-full'),
	};

	if (env.DATABASE_SSL_CA) {
		ssl.ca = env.DATABASE_SSL_CA.replace(/\\n/g, '\n');
	}

	return {
		connectionString,
		ssl,
	};
}
