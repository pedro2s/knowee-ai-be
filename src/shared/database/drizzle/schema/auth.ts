import { pgSchema, uuid, varchar } from 'drizzle-orm/pg-core';

export const authSchema = pgSchema('auth');

export const users = authSchema.table('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 256 }),
});
