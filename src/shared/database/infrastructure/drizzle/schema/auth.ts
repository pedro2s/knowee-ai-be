import { text } from 'drizzle-orm/pg-core';
import { jsonb } from 'drizzle-orm/pg-core';
import { timestamp } from 'drizzle-orm/pg-core';
import { pgSchema, uuid } from 'drizzle-orm/pg-core';

export const authSchema = pgSchema('auth');

export const users = authSchema.table('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	email: text('email').notNull(),
	encryptedPassword: text('encrypted_password').notNull(),
	emailConfirmedAt: timestamp('email_confirmed_at', {
		withTimezone: true,
		mode: 'string',
	}),
	invitedAt: timestamp('invited_at', {
		withTimezone: true,
		mode: 'string',
	}),
	confirmationToken: text('confirmation_token'),
	recoveryToken: text('recovery_token'),
	emailChangeToken: text('email_change_token'),
	emailChange: text('email_change'),
	role: text('role').default('authenticated'),
	rawAppMetaData: jsonb('raw_app_meta_data').default({}).notNull(),
	rawUserMetaData: jsonb('raw_user_meta_data').default({}).notNull(),
	lastSignInAt: timestamp('last_sign_in_at', {
		withTimezone: true,
		mode: 'string',
	}),
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
});
