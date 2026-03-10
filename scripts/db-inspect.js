require('dotenv/config');

const crypto = require('node:crypto');
const fs = require('node:fs');
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	console.error('DATABASE_URL is not set');
	process.exit(1);
}

async function main() {
	const client = new Client({ connectionString });
	await client.connect();

	const fileHashes = {};
	for (const file of [
		'drizzle/0009_queue_generation_infra.sql',
		'drizzle/0010_vengeful_prodigy.sql',
	]) {
		if (fs.existsSync(file)) {
			fileHashes[file] = crypto
				.createHash('sha256')
				.update(fs.readFileSync(file, 'utf8'))
				.digest('hex');
		}
	}

	const [target, subscriptionTierColumns, subscriptionTables, migrationTables] =
		await Promise.all([
			client.query('select current_database() as db, current_user as usr'),
			client.query(`
			select table_schema, table_name, column_name
			from information_schema.columns
			where table_name = 'subscription_tier'
				and column_name in ('created_at', 'updated_at')
			order by table_schema, table_name, column_name
		`),
			client.query(`
			select table_schema, table_name
			from information_schema.tables
			where table_name like '%subscription%'
			order by table_schema, table_name
		`),
			client.query(`
			select schemaname, tablename
			from pg_tables
			where tablename in ('__drizzle_migrations', 'pgmigrations')
			order by schemaname, tablename
		`),
		]);

	let recentMigrations = [];
	for (const table of migrationTables.rows) {
		const qualifiedName = `"${table.schemaname}"."${table.tablename}"`;
		const result = await client.query(`
			select *
			from ${qualifiedName}
			order by 1 desc
			limit 10
		`);
		recentMigrations.push({
			table: `${table.schemaname}.${table.tablename}`,
			rows: result.rows,
		});
	}

	console.log(
		JSON.stringify(
			{
				target: target.rows,
				subscriptionTierColumns: subscriptionTierColumns.rows,
				subscriptionTables: subscriptionTables.rows,
				migrationTables: migrationTables.rows,
				recentMigrations,
				fileHashes,
			},
			null,
			2
		)
	);

	await client.end();
}

main().catch((error) => {
	console.error(error.stack || error);
	process.exit(1);
});
