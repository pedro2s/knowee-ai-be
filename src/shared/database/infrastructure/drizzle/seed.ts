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
			{
				id: 2,
				name: 'starter',
				monthlyTokenLimit: 100000,
				price: '97.00',
				stripePriceId: 'price_1T4n0KAnidSdBpg9Yr8hZI2a',
				displayName: 'Iniciante',
				billingPeriod: '/mes',
				description: 'Para criadores que querem escalar com IA sem friccao.',
				features:
					'["Cursos ilimitados", "IA avancada", "Exportacao LMS", "Suporte prioritario por email (ate 72h)", "Tokens/mes: 100k"]',
				isHighlighted: true,
				isContactOnly: false,
				sortOrder: 2,
				isPublic: true,
				supportChannel: 'email',
				supportSlaHours: 72,
				stripePriceIdAnnual: 'price_1T4n32AnidSdBpg9P6J9bUhC',
				annualPrice: '933.00',
			},
			{
				id: 3,
				name: 'pro',
				monthlyTokenLimit: 400000,
				price: '197.00',
				stripePriceId: 'price_1T4n4FAnidSdBpg9EUgrIxmD',
				displayName: 'Professional',
				billingPeriod: '/mes',
				description: 'Para operacoes com volume alto e automacao avancada.',
				features:
					'["Tudo do Iniciante", "API customizada", "Suporte dedicado por email (ate 72h)", "Tokens/mes: 400k"]',
				isHighlighted: false,
				isContactOnly: false,
				sortOrder: 3,
				isPublic: false,
				supportChannel: 'email',
				supportSlaHours: 72,
				stripePriceIdAnnual: 'price_1T4nO7AnidSdBpg9CZnkMk0s',
				annualPrice: '1893.00',
			},
			{
				id: 4,
				name: 'enterprise',
				monthlyTokenLimit: 2000000,
				price: null,
				stripePriceId: null,
				displayName: 'Empresarial',
				billingPeriod: null,
				description: 'Plano sob medida para necessidades empresariais.',
				features:
					'["Tudo do Professional", "White-label", "Arquitetura sob consulta", "Suporte humano por email (ate 72h)"]',
				isHighlighted: false,
				isContactOnly: true,
				sortOrder: 4,
				isPublic: false,
				supportChannel: 'email',
				supportSlaHours: 72,
				stripePriceIdAnnual: null,
				annualPrice: null,
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
