import { relations } from 'drizzle-orm/relations';
import { courses } from './courses';
import { modules } from './modules';
import { qaHistory } from './qa-history';
import { profiles } from './profiles';
import { history } from './history';
import { lessons } from './lessons';
import { muxData } from './mux-data';
import { subscribers } from './subscribers';
import { subscriptionTier } from './subscription-tier';
import { tokenUsage } from './token-usage';
import { historySummary } from './history-summary';

import { users as usersInAuth } from './auth';

export const modulesRelations = relations(modules, ({ one, many }) => ({
	course: one(courses, {
		fields: [modules.courseId],
		references: [courses.id],
	}),
	lessons: many(lessons),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
	modules: many(modules),
	qaHistories: many(qaHistory),
	histories: many(history),
	usersInAuth: one(usersInAuth, {
		fields: [courses.userId],
		references: [usersInAuth.id],
	}),
	lessons: many(lessons),
	historySummaries: many(historySummary),
}));

export const qaHistoryRelations = relations(qaHistory, ({ one }) => ({
	course: one(courses, {
		fields: [qaHistory.courseId],
		references: [courses.id],
	}),
	usersInAuth: one(usersInAuth, {
		fields: [qaHistory.userId],
		references: [usersInAuth.id],
	}),
}));

export const usersInAuthRelations = relations(usersInAuth, ({ many }) => ({
	qaHistories: many(qaHistory),
	profiles: many(profiles),
	subscribers: many(subscribers),
	courses: many(courses),
	tokenUsages: many(tokenUsage),
	historySummaries: many(historySummary),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
	usersInAuth: one(usersInAuth, {
		fields: [profiles.id],
		references: [usersInAuth.id],
	}),
}));

export const historyRelations = relations(history, ({ one }) => ({
	course: one(courses, {
		fields: [history.courseId],
		references: [courses.id],
	}),
}));

export const muxDataRelations = relations(muxData, ({ one }) => ({
	lesson: one(lessons, {
		fields: [muxData.lessonId],
		references: [lessons.id],
	}),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
	muxData: many(muxData),
	course: one(courses, {
		fields: [lessons.courseId],
		references: [courses.id],
	}),
	module: one(modules, {
		fields: [lessons.moduleId],
		references: [modules.id],
	}),
}));

export const subscribersRelations = relations(subscribers, ({ one, many }) => ({
	subscriptionTier: one(subscriptionTier, {
		fields: [subscribers.subscriptionTierId],
		references: [subscriptionTier.id],
	}),
	usersInAuth: one(usersInAuth, {
		fields: [subscribers.userId],
		references: [usersInAuth.id],
	}),
	tokenUsages: many(tokenUsage),
}));

export const subscriptionTierRelations = relations(
	subscriptionTier,
	({ many }) => ({
		subscribers: many(subscribers),
	}),
);

export const tokenUsageRelations = relations(tokenUsage, ({ one }) => ({
	subscriber: one(subscribers, {
		fields: [tokenUsage.subscriptionId],
		references: [subscribers.id],
	}),
	usersInAuth: one(usersInAuth, {
		fields: [tokenUsage.userId],
		references: [usersInAuth.id],
	}),
}));

export const historySummaryRelations = relations(historySummary, ({ one }) => ({
	course: one(courses, {
		fields: [historySummary.courseId],
		references: [courses.id],
	}),
	usersInAuth: one(usersInAuth, {
		fields: [historySummary.userId],
		references: [usersInAuth.id],
	}),
}));
