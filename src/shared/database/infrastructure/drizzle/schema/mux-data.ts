import {
	pgTable,
	serial,
	uuid,
	foreignKey,
	timestamp,
	unique,
	varchar,
} from 'drizzle-orm/pg-core';
import { lessons } from './lessons';

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
	]
);
