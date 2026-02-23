import {
	foreignKey,
	index,
	jsonb,
	pgPolicy,
	pgTable,
	text,
	timestamp,
	uuid,
	uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './auth';
import { courses } from './courses';
import { sql } from 'drizzle-orm';

export const providerPreferences = pgTable(
	'provider_preferences',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		userId: uuid('user_id').notNull(),
		imageProvider: text('image_provider').notNull().default('openai'),
		audioProvider: text('audio_provider').notNull().default('openai'),
		audioVoiceId: text('audio_voice_id').notNull().default('nova'),
		videoProvider: text('video_provider').notNull().default('openai'),
		advancedSettings: jsonb('advanced_settings').notNull().default({}),
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
		uniqueIndex('provider_preferences_user_id_uidx').on(table.userId),
		index('idx_provider_preferences_user_id').on(table.userId),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: 'provider_preferences_user_id_fkey',
		}).onDelete('cascade'),
		pgPolicy('Users can view their own provider preferences', {
			as: 'permissive',
			for: 'select',
			to: ['public'],
			using: sql`(auth.uid() = user_id)`,
		}),
		pgPolicy('Users can insert their own provider preferences', {
			as: 'permissive',
			for: 'insert',
			to: ['public'],
		}),
		pgPolicy('Users can update their own provider preferences', {
			as: 'permissive',
			for: 'update',
			to: ['public'],
		}),
	]
);

export const courseProviderPreferences = pgTable(
	'course_provider_preferences',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		courseId: uuid('course_id').notNull(),
		userId: uuid('user_id').notNull(),
		imageProvider: text('image_provider').notNull().default('openai'),
		audioProvider: text('audio_provider').notNull().default('openai'),
		audioVoiceId: text('audio_voice_id').notNull().default('nova'),
		videoProvider: text('video_provider').notNull().default('openai'),
		advancedSettings: jsonb('advanced_settings').notNull().default({}),
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
		uniqueIndex('course_provider_preferences_course_id_uidx').on(
			table.courseId
		),
		index('idx_course_provider_preferences_user_id').on(table.userId),
		index('idx_course_provider_preferences_course_id').on(table.courseId),
		foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: 'course_provider_preferences_course_id_fkey',
		}).onDelete('cascade'),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: 'course_provider_preferences_user_id_fkey',
		}).onDelete('cascade'),
		pgPolicy('Users can view own course provider preferences', {
			as: 'permissive',
			for: 'select',
			to: ['public'],
			using: sql`(auth.uid() = user_id)`,
		}),
		pgPolicy('Users can insert own course provider preferences', {
			as: 'permissive',
			for: 'insert',
			to: ['public'],
		}),
		pgPolicy('Users can update own course provider preferences', {
			as: 'permissive',
			for: 'update',
			to: ['public'],
		}),
	]
);
