import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DrizzleService } from 'src/shared/database/infrastructure/drizzle/drizzle.service';
import {
	courseProviderPreferences,
	providerPreferences,
	courses,
} from 'src/shared/database/infrastructure/drizzle/schema';
import { ProviderPreferenceSelection } from '../../../domain/entities/provider-preferences.types';

@Injectable()
export class DrizzleProviderPreferencesRepository {
	constructor(private readonly drizzle: DrizzleService) {}

	async getDefaults(
		userId: string
	): Promise<ProviderPreferenceSelection | null> {
		const current = await this.drizzle.db.query.providerPreferences.findFirst({
			where: eq(providerPreferences.userId, userId),
		});

		if (!current) {
			return null;
		}

		return {
			imageProvider: current.imageProvider,
			audioProvider: current.audioProvider,
			audioVoiceId: current.audioVoiceId,
			videoProvider: current.videoProvider,
			advancedSettings: current.advancedSettings as Record<string, unknown>,
		};
	}

	async upsertDefaults(
		userId: string,
		input: ProviderPreferenceSelection
	): Promise<ProviderPreferenceSelection> {
		const [saved] = await this.drizzle.db
			.insert(providerPreferences)
			.values({
				userId,
				imageProvider: input.imageProvider,
				audioProvider: input.audioProvider,
				audioVoiceId: input.audioVoiceId,
				videoProvider: input.videoProvider,
				advancedSettings: input.advancedSettings ?? {},
			})
			.onConflictDoUpdate({
				target: providerPreferences.userId,
				set: {
					imageProvider: input.imageProvider,
					audioProvider: input.audioProvider,
					audioVoiceId: input.audioVoiceId,
					videoProvider: input.videoProvider,
					advancedSettings: input.advancedSettings ?? {},
					updatedAt: new Date().toISOString(),
				},
			})
			.returning();

		return {
			imageProvider: saved.imageProvider,
			audioProvider: saved.audioProvider,
			audioVoiceId: saved.audioVoiceId,
			videoProvider: saved.videoProvider,
			advancedSettings: saved.advancedSettings as Record<string, unknown>,
		};
	}

	async getCourseOverride(
		userId: string,
		courseId: string
	): Promise<ProviderPreferenceSelection | null> {
		const current = await this.drizzle.db
			.select()
			.from(courseProviderPreferences)
			.where(
				and(
					eq(courseProviderPreferences.userId, userId),
					eq(courseProviderPreferences.courseId, courseId)
				)
			)
			.limit(1);

		if (!current[0]) {
			return null;
		}

		return {
			imageProvider: current[0].imageProvider,
			audioProvider: current[0].audioProvider,
			audioVoiceId: current[0].audioVoiceId,
			videoProvider: current[0].videoProvider,
			advancedSettings: current[0].advancedSettings as Record<string, unknown>,
		};
	}

	async upsertCourseOverride(
		userId: string,
		courseId: string,
		input: ProviderPreferenceSelection
	): Promise<ProviderPreferenceSelection> {
		const [saved] = await this.drizzle.db
			.insert(courseProviderPreferences)
			.values({
				userId,
				courseId,
				imageProvider: input.imageProvider,
				audioProvider: input.audioProvider,
				audioVoiceId: input.audioVoiceId,
				videoProvider: input.videoProvider,
				advancedSettings: input.advancedSettings ?? {},
			})
			.onConflictDoUpdate({
				target: courseProviderPreferences.courseId,
				set: {
					imageProvider: input.imageProvider,
					audioProvider: input.audioProvider,
					audioVoiceId: input.audioVoiceId,
					videoProvider: input.videoProvider,
					advancedSettings: input.advancedSettings ?? {},
					updatedAt: new Date().toISOString(),
				},
			})
			.returning();

		return {
			imageProvider: saved.imageProvider,
			audioProvider: saved.audioProvider,
			audioVoiceId: saved.audioVoiceId,
			videoProvider: saved.videoProvider,
			advancedSettings: saved.advancedSettings as Record<string, unknown>,
		};
	}

	async assertCourseOwnership(
		userId: string,
		courseId: string
	): Promise<boolean> {
		const owner = await this.drizzle.db
			.select({ id: courses.id })
			.from(courses)
			.where(and(eq(courses.id, courseId), eq(courses.userId, userId)))
			.limit(1);

		return !!owner[0];
	}
}
