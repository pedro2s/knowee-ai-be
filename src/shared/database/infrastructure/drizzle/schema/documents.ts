import {
	pgTable,
	index,
	pgPolicy,
	serial,
	uuid,
	text,
	vector,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const documents = pgTable(
	'documents',
	{
		id: serial().primaryKey().notNull(),
		userId: uuid('user_id'),
		content: text(),
		embedding: vector({ dimensions: 1536 }),
	},
	(table) => [
		index('documents_embedding_idx')
			.using(
				'ivfflat',
				table.embedding.asc().nullsLast().op('vector_cosine_ops')
			)
			.with({ lists: '100' }),
		pgPolicy('Usuário pode ver seus próprios documentos', {
			as: 'permissive',
			for: 'select',
			to: ['public'],
			using: sql`(user_id = auth.uid())`,
		}),
		pgPolicy('Usuário pode inserir documentos seus próprios documentos', {
			as: 'permissive',
			for: 'insert',
			to: ['public'],
		}),
		pgPolicy('Usuário pode atualizar seus próprios documentos', {
			as: 'permissive',
			for: 'update',
			to: ['public'],
		}),
		pgPolicy('Usuário pode excluir seus próprios documentos', {
			as: 'permissive',
			for: 'delete',
			to: ['public'],
		}),
	]
);
