require('dotenv/config');

const { spawnSync } = require('node:child_process');

function maskPassword(connectionString) {
	try {
		const parsed = new URL(connectionString);
		if (parsed.password) {
			parsed.password = '***';
		}
		return parsed.toString();
	} catch {
		return connectionString;
	}
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	console.error('DATABASE_URL is not set');
	process.exit(1);
}

try {
	// Log the effective target before applying migrations.
	const parsed = new URL(connectionString);
	console.log(
		`Applying Drizzle migrations to ${parsed.hostname}:${parsed.port || '5432'}/${parsed.pathname.replace(/^\//, '')}`
	);
	console.log(`Connection string: ${maskPassword(connectionString)}`);
} catch {
	console.log(
		`Applying Drizzle migrations using DATABASE_URL=${maskPassword(connectionString)}`
	);
}

const result = spawnSync(
	process.platform === 'win32' ? 'npx.cmd' : 'npx',
	['drizzle-kit', 'migrate', '--config', './drizzle.config.ts'],
	{ stdio: 'inherit', env: process.env }
);

if (result.error) {
	console.error(result.error.stack || result.error);
	process.exit(1);
}

process.exit(result.status ?? 1);
