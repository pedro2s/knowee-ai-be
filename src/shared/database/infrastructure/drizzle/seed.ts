import 'dotenv/config';
import { Pool } from 'pg';
import { NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { buildPgPoolConfig } from './database-connection';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool(buildPgPoolConfig(connectionString!, process.env));
const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });

async function main() {
	console.log('🌱 Seeding database...');

	await db
		.insert(schema.subscriptionTier)
		.values([
			{
				id: 1,
				name: 'free',
				displayName: 'Gratuito',
				description: 'Ideal para testar a plataforma com autoatendimento.',
				price: '0.00',
				sortOrder: 1,
				monthlyTokenLimit: 200000,
				isHighlighted: false,
				isContactOnly: false,
				isPublic: true,
				supportChannel: 'email',
				supportSlaHours: 72,
				features: [
					'1 curso de amostra vitalicio',
					'Sem geracao de assets',
					'Sem exportacao',
					'IA limitada por tokens',
					'Suporte humano por email (ate 72h)',
				],
			},
		])
		.onConflictDoNothing();

	console.log('✅ Seeding finished.');
	process.exit(0);
}

main().catch((err) => {
	console.error('❌ Seeding failed!');
	console.error(err);
	process.exit(1);
});
