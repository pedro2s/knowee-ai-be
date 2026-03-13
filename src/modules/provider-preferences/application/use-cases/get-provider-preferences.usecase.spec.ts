import { GetProviderPreferencesUseCase } from './get-provider-preferences.usecase';
import type { DrizzleProviderPreferencesRepository } from '../../infrastructure/persistence/drizzle/drizzle-provider-preferences.repository';

describe('GetProviderPreferencesUseCase', () => {
	it('deve usar defaults persistidos e override do curso', async () => {
		const repository = {
			getDefaults: jest.fn().mockResolvedValue({
				imageProvider: 'openai',
				audioProvider: 'openai',
				audioVoiceId: 'nova',
				videoProvider: 'openai',
				advancedSettings: {},
			}),
			getCourseOverride: jest.fn().mockResolvedValue({
				imageProvider: 'replicate',
				audioProvider: 'openai',
				audioVoiceId: 'nova',
				videoProvider: 'runway',
				advancedSettings: {},
			}),
		} as unknown as jest.Mocked<DrizzleProviderPreferencesRepository>;

		const useCase = new GetProviderPreferencesUseCase(repository);

		await expect(
			useCase.execute({ userId: 'user-1', courseId: 'course-1' })
		).resolves.toEqual({
			defaults: {
				imageProvider: 'openai',
				audioProvider: 'openai',
				audioVoiceId: 'nova',
				videoProvider: 'openai',
				advancedSettings: {},
			},
			courseOverride: {
				imageProvider: 'replicate',
				audioProvider: 'openai',
				audioVoiceId: 'nova',
				videoProvider: 'runway',
				advancedSettings: {},
			},
			effective: {
				imageProvider: 'replicate',
				audioProvider: 'openai',
				audioVoiceId: 'nova',
				videoProvider: 'runway',
				advancedSettings: {},
			},
		});
	});

	it('deve usar defaults do sistema quando o usuario nao tiver preferencias', async () => {
		const repository = {
			getDefaults: jest.fn().mockResolvedValue(null),
			getCourseOverride: jest.fn(),
		} as unknown as jest.Mocked<DrizzleProviderPreferencesRepository>;

		const useCase = new GetProviderPreferencesUseCase(repository);

		await expect(useCase.execute({ userId: 'user-1' })).resolves.toEqual({
			defaults: {
				imageProvider: 'openai',
				audioProvider: 'openai',
				audioVoiceId: 'nova',
				videoProvider: 'openai',
				advancedSettings: {},
			},
			courseOverride: null,
			effective: {
				imageProvider: 'openai',
				audioProvider: 'openai',
				audioVoiceId: 'nova',
				videoProvider: 'openai',
				advancedSettings: {},
			},
		});
		expect(repository.getCourseOverride).not.toHaveBeenCalled();
	});
});
