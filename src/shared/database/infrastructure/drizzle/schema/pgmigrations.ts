import { pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

export const pgmigrations = pgTable('pgmigrations', {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	runOn: timestamp('run_on', { mode: 'string' }).notNull(),
});
