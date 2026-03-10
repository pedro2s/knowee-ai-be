require('dotenv/config');

const crypto = require('node:crypto');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const { Client } = require('pg');

function getConnectionString() {
	if (!process.env.DATABASE_URL) {
		throw new Error('DATABASE_URL is not set');
	}

	return process.env.DATABASE_URL;
}

function withDatabase(connectionString, databaseName) {
	const parsed = new URL(connectionString);
	parsed.pathname = `/${databaseName}`;
	return parsed.toString();
}

function hashFile(filePath) {
	return crypto
		.createHash('sha256')
		.update(fs.readFileSync(filePath, 'utf8'))
		.digest('hex');
}

async function queryTempDb(tempConnectionString, sql) {
	const client = new Client({ connectionString: tempConnectionString });
	await client.connect();
	try {
		return await client.query(sql);
	} finally {
		await client.end();
	}
}

async function main() {
	const baseConnectionString = getConnectionString();
	const adminConnectionString = withDatabase(baseConnectionString, 'postgres');
	const tempDbName = `knowee_migration_check_${Date.now()}`;
	const tempConnectionString = withDatabase(baseConnectionString, tempDbName);
	const adminClient = new Client({ connectionString: adminConnectionString });

	await adminClient.connect();

	try {
		await adminClient.query(
			`CREATE DATABASE "${tempDbName}" TEMPLATE template0`
		);
	} finally {
		await adminClient.end();
	}

	try {
		const migrate = spawnSync(
			process.platform === 'win32' ? 'npx.cmd' : 'npx',
			['drizzle-kit', 'migrate', '--config', './drizzle.config.ts'],
			{
				stdio: 'inherit',
				env: { ...process.env, DATABASE_URL: tempConnectionString },
			}
		);

		if (migrate.error) {
			throw migrate.error;
		}

		if ((migrate.status ?? 1) !== 0) {
			throw new Error(
				`drizzle-kit migrate exited with status ${migrate.status}`
			);
		}

		const [columns, migrations] = await Promise.all([
			queryTempDb(
				tempConnectionString,
				`
					select column_name
					from information_schema.columns
					where table_schema = 'public'
						and table_name = 'subscription_tier'
						and column_name in ('created_at', 'updated_at')
					order by column_name
				`
			),
			queryTempDb(
				tempConnectionString,
				`
					select hash
					from drizzle.__drizzle_migrations
					order by id desc
					limit 1
				`
			),
		]);

		const expectedHash = hashFile('drizzle/0010_vengeful_prodigy.sql');
		const foundColumns = columns.rows.map((row) => row.column_name);
		const latestHash = migrations.rows[0]?.hash;

		if (foundColumns.join(',') !== 'created_at,updated_at') {
			throw new Error(
				`subscription_tier columns mismatch in temp db: ${foundColumns.join(',') || 'none'}`
			);
		}

		if (latestHash !== expectedHash) {
			throw new Error(
				`latest migration hash mismatch in temp db: ${latestHash ?? 'none'}`
			);
		}

		console.log(`Verified migrations on temporary database ${tempDbName}`);
	} finally {
		const cleanupClient = new Client({
			connectionString: adminConnectionString,
		});
		await cleanupClient.connect();
		try {
			await cleanupClient.query(`
				select pg_terminate_backend(pid)
				from pg_stat_activity
				where datname = '${tempDbName}'
					and pid <> pg_backend_pid()
			`);
			await cleanupClient.query(`DROP DATABASE IF EXISTS "${tempDbName}"`);
		} finally {
			await cleanupClient.end();
		}
	}
}

main().catch((error) => {
	console.error(error.stack || error);
	process.exit(1);
});
