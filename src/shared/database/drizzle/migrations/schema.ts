import {
	pgSchema,
	pgTable,
	index,
	pgPolicy,
	serial,
	uuid,
	text,
	vector,
	foreignKey,
	integer,
	timestamp,
	jsonb,
	unique,
	varchar,
	boolean,
	numeric,
	check,
	primaryKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const authSchema = pgSchema('auth');

export const users = authSchema.table('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 256 }),
});
export const usersInAuth = users;

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
				table.embedding.asc().nullsLast().op('vector_cosine_ops'),
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
	],
);

export const modules = pgTable(
	'modules',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		courseId: uuid('course_id').notNull(),
		title: text().notNull(),
		description: text(),
		orderIndex: integer('order_index').default(1).notNull(),
		createdAt: timestamp('created_at', {
			withTimezone: true,
			mode: 'string',
		})
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', {
			withTimezone: true,
			mode: 'string',
		})
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index('idx_modules_course_id').using(
			'btree',
			table.courseId.asc().nullsLast().op('uuid_ops'),
		),
		index('idx_modules_order').using(
			'btree',
			table.courseId.asc().nullsLast().op('int4_ops'),
			table.orderIndex.asc().nullsLast().op('int4_ops'),
		),
		foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: 'modules_course_id_fkey',
		}).onDelete('cascade'),
		pgPolicy('Users can view their own course modules', {
			as: 'permissive',
			for: 'select',
			to: ['public'],
			using: sql`(EXISTS ( SELECT 1
   FROM courses
  WHERE ((courses.id = modules.course_id) AND (courses.user_id = auth.uid()))))`,
		}),
		pgPolicy('Users can create modules for their courses', {
			as: 'permissive',
			for: 'insert',
			to: ['public'],
		}),
		pgPolicy('Users can update their course modules', {
			as: 'permissive',
			for: 'update',
			to: ['public'],
		}),
		pgPolicy('Users can delete their course modules', {
			as: 'permissive',
			for: 'delete',
			to: ['public'],
		}),
	],
);

export const qaHistory = pgTable(
	'qa_history',
	{
		id: serial().primaryKey().notNull(),
		userId: uuid('user_id'),
		courseId: uuid('course_id'),
		question: text(),
		answer: text(),
		createdAt: timestamp('created_at', {
			withTimezone: true,
			mode: 'string',
		})
			.defaultNow()
			.notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: 'qa_history_course_id_fkey',
		}).onDelete('cascade'),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: 'qa_history_user_id_fkey',
		}),
		pgPolicy('Usuário pode ver seus próprios históricos', {
			as: 'permissive',
			for: 'select',
			to: ['public'],
			using: sql`(user_id = auth.uid())`,
		}),
		pgPolicy('Usuário pode inserir seus próprios historicos', {
			as: 'permissive',
			for: 'insert',
			to: ['public'],
		}),
	],
);

export const profiles = pgTable(
	'profiles',
	{
		id: uuid().primaryKey().notNull(),
		email: text(),
		fullName: text('full_name'),
		avatarUrl: text('avatar_url'),
		createdAt: timestamp('created_at', {
			withTimezone: true,
			mode: 'string',
		})
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', {
			withTimezone: true,
			mode: 'string',
		})
			.defaultNow()
			.notNull(),
		phone: text(),
		company: text(),
		bio: text(),
	},
	(table) => [
		foreignKey({
			columns: [table.id],
			foreignColumns: [users.id],
			name: 'profiles_id_fkey',
		}).onDelete('cascade'),
		pgPolicy('Users can view their own profile', {
			as: 'permissive',
			for: 'select',
			to: ['public'],
			using: sql`(auth.uid() = id)`,
		}),
		pgPolicy('Users can update their own profile', {
			as: 'permissive',
			for: 'update',
			to: ['public'],
		}),
		pgPolicy('Users can insert their own profile', {
			as: 'permissive',
			for: 'insert',
			to: ['public'],
		}),
	],
);

export const history = pgTable(
	'history',
	{
		id: serial().primaryKey().notNull(),
		userId: uuid('user_id'),
		message: jsonb(),
		createdAt: timestamp('created_at', {
			withTimezone: true,
			mode: 'string',
		})
			.defaultNow()
			.notNull(),
		courseId: uuid('course_id'),
	},
	(table) => [
		index('history_user_id_idx').using(
			'btree',
			table.userId.asc().nullsLast().op('uuid_ops'),
		),
		foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: 'history_course_id_fkey',
		}).onDelete('cascade'),
		pgPolicy('Usuário pode ver seus próprios históricos', {
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
		pgPolicy('Users can delete their own history', {
			as: 'permissive',
			for: 'delete',
			to: ['public'],
		}),
	],
);

export const muxData = pgTable(
	'mux_data',
	{
		id: serial().primaryKey().notNull(),
		assetId: varchar('asset_id', { length: 255 }).notNull(),
		playbackId: varchar('playback_id', { length: 255 }).notNull(),
		lessonId: uuid('lesson_id').notNull(),
		createdAt: timestamp('created_at', {
			withTimezone: true,
			mode: 'string',
		})
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', {
			withTimezone: true,
			mode: 'string',
		})
			.defaultNow()
			.notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.lessonId],
			foreignColumns: [lessons.id],
			name: 'mux_data_lesson_id_fkey',
		}).onDelete('cascade'),
		unique('mux_data_lesson_id_unique').on(table.lessonId),
	],
);

export const pgmigrations = pgTable('pgmigrations', {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	runOn: timestamp('run_on', { mode: 'string' }).notNull(),
});

export const subscribers = pgTable(
	'subscribers',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		userId: uuid('user_id'),
		email: text().notNull(),
		stripeCustomerId: text('stripe_customer_id'),
		subscribed: boolean().default(false).notNull(),
		subscriptionEnd: timestamp('subscription_end', {
			withTimezone: true,
			mode: 'string',
		}),
		updatedAt: timestamp('updated_at', {
			withTimezone: true,
			mode: 'string',
		})
			.defaultNow()
			.notNull(),
		createdAt: timestamp('created_at', {
			withTimezone: true,
			mode: 'string',
		})
			.defaultNow()
			.notNull(),
		subscriptionTierId: integer('subscription_tier_id').notNull(),
		stripeSubscriptionId: text('stripe_subscription_id'),
	},
	(table) => [
		foreignKey({
			columns: [table.subscriptionTierId],
			foreignColumns: [subscriptionTier.id],
			name: 'subscribers_subscription_tier_id_fkey',
		}),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: 'subscribers_user_id_fkey',
		}).onDelete('cascade'),
		pgPolicy('select_own_subscription', {
			as: 'permissive',
			for: 'select',
			to: ['public'],
			using: sql`((user_id = auth.uid()) OR (email = auth.email()))`,
		}),
		pgPolicy('update_own_subscription', {
			as: 'permissive',
			for: 'update',
			to: ['public'],
		}),
		pgPolicy('insert_subscription', {
			as: 'permissive',
			for: 'insert',
			to: ['public'],
		}),
	],
);

export const courses = pgTable(
	'courses',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		userId: uuid('user_id').notNull(),
		title: text().notNull(),
		description: text(),
		category: text(),
		level: text(),
		duration: text(),
		targetAudience: text('target_audience'),
		objectives: text(),
		files: jsonb().default([]),
		createdAt: timestamp('created_at', {
			withTimezone: true,
			mode: 'string',
		})
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', {
			withTimezone: true,
			mode: 'string',
		})
			.defaultNow()
			.notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: 'courses_user_id_fkey',
		}),
		pgPolicy('Users can view their own courses', {
			as: 'permissive',
			for: 'select',
			to: ['public'],
			using: sql`(auth.uid() = user_id)`,
		}),
		pgPolicy('Users can create their own courses', {
			as: 'permissive',
			for: 'insert',
			to: ['public'],
		}),
		pgPolicy('Users can update their own courses', {
			as: 'permissive',
			for: 'update',
			to: ['public'],
		}),
		pgPolicy('Users can delete their own courses', {
			as: 'permissive',
			for: 'delete',
			to: ['public'],
		}),
	],
);

export const tokenUsage = pgTable(
	'token_usage',
	{
		id: serial().primaryKey().notNull(),
		userId: uuid('user_id').notNull(),
		totalTokens: integer('total_tokens'),
		model: text().notNull(),
		createdAt: timestamp('created_at', {
			withTimezone: true,
			mode: 'string',
		})
			.defaultNow()
			.notNull(),
		subscriptionId: uuid('subscription_id').notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.subscriptionId],
			foreignColumns: [subscribers.id],
			name: 'token_usage_subscription_id_fkey',
		}),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: 'token_usage_user_id_fkey',
		}),
	],
);

export const subscriptionTier = pgTable('subscription_tier', {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	monthlyTokenLimit: integer('monthly_token_limit').notNull(),
	price: numeric({ precision: 8, scale: 2 }),
	stripePriceId: text('stripe_price_id'),
});

export const lessons = pgTable(
	'lessons',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		courseId: uuid('course_id').notNull(),
		moduleId: uuid('module_id').notNull(),
		title: text().notNull(),
		description: text(),
		lessonType: text('lesson_type').notNull(),
		content: jsonb().default({}),
		assets: jsonb().default([]),
		orderIndex: integer('order_index').default(1).notNull(),
		duration: integer(),
		isPublished: boolean('is_published').default(false),
		createdAt: timestamp('created_at', {
			withTimezone: true,
			mode: 'string',
		})
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', {
			withTimezone: true,
			mode: 'string',
		})
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index('idx_lessons_course_id').using(
			'btree',
			table.courseId.asc().nullsLast().op('uuid_ops'),
		),
		index('idx_lessons_module_id').using(
			'btree',
			table.moduleId.asc().nullsLast().op('uuid_ops'),
		),
		index('idx_lessons_order').using(
			'btree',
			table.courseId.asc().nullsLast().op('int4_ops'),
			table.moduleId.asc().nullsLast().op('uuid_ops'),
			table.orderIndex.asc().nullsLast().op('uuid_ops'),
		),
		foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: 'lessons_course_id_fkey',
		}).onDelete('cascade'),
		foreignKey({
			columns: [table.moduleId],
			foreignColumns: [modules.id],
			name: 'lessons_module_id_fkey',
		}).onDelete('cascade'),
		pgPolicy('Users can view their own course lessons', {
			as: 'permissive',
			for: 'select',
			to: ['public'],
			using: sql`(EXISTS ( SELECT 1
   FROM courses
  WHERE ((courses.id = lessons.course_id) AND (courses.user_id = auth.uid()))))`,
		}),
		pgPolicy('Users can create lessons for their courses', {
			as: 'permissive',
			for: 'insert',
			to: ['public'],
		}),
		pgPolicy('Users can update their course lessons', {
			as: 'permissive',
			for: 'update',
			to: ['public'],
		}),
		pgPolicy('Users can delete their course lessons', {
			as: 'permissive',
			for: 'delete',
			to: ['public'],
		}),
		check(
			'lessons_lesson_type_check',
			sql`lesson_type = ANY (ARRAY['video'::text, 'audio'::text, 'quiz'::text, 'pdf'::text, 'external'::text, 'article'::text])`,
		),
	],
);

export const historySummary = pgTable(
	'history_summary',
	{
		userId: uuid('user_id').notNull(),
		courseId: uuid('course_id').notNull(),
		summary: text().default(''),
		createdAt: timestamp('created_at', {
			withTimezone: true,
			mode: 'string',
		})
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', {
			withTimezone: true,
			mode: 'string',
		})
			.defaultNow()
			.notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: 'history_summary_course_id_fkey',
		}).onDelete('cascade'),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: 'history_summary_user_id_fkey',
		}).onDelete('cascade'),
		primaryKey({
			columns: [table.userId, table.courseId],
			name: 'history_summary_pkey',
		}),
	],
);
