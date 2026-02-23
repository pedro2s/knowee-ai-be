import { Injectable } from '@nestjs/common';
import { DrizzleProviderPreferencesRepository } from '../../infrastructure/persistence/drizzle/drizzle-provider-preferences.repository';
import {
	EffectiveProviderPreferences,
	ProviderPreferenceSelection,
} from '../../domain/entities/provider-preferences.types';

@Injectable()
export class GetProviderPreferencesUseCase {
	constructor(
		private readonly repository: DrizzleProviderPreferencesRepository
	) {}

	async execute(input: {
		userId: string;
		courseId?: string;
	}): Promise<EffectiveProviderPreferences> {
		const defaults =
			(await this.repository.getDefaults(input.userId)) ??
			this.getSystemDefaultSelection();

		const courseOverride = input.courseId
			? await this.repository.getCourseOverride(input.userId, input.courseId)
			: null;

		return {
			defaults,
			courseOverride,
			effective: courseOverride ?? defaults,
		};
	}

	private getSystemDefaultSelection(): ProviderPreferenceSelection {
		return {
			imageProvider: 'openai',
			audioProvider: 'openai',
			audioVoiceId: 'nova',
			videoProvider: 'openai',
			advancedSettings: {},
		};
	}
}
