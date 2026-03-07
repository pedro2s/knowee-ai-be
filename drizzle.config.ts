import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { buildDrizzleConfig } from './src/shared/database/infrastructure/drizzle/database-connection';

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL is not set in .env file');
}

export default defineConfig({
	out: './drizzle',
	schema: './src/shared/database/infrastructure/drizzle/schema/index.ts',
	dialect: 'postgresql',
	dbCredentials: buildDrizzleConfig(process.env.DATABASE_URL, process.env),
	verbose: true,
	strict: true,
});
