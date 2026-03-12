import { ProviderPreferencesController } from './provider-preferences.controller';
import type { GetProviderCatalogUseCase } from '../../application/use-cases/get-provider-catalog.usecase';
import type { GetProviderPreferencesUseCase } from '../../application/use-cases/get-provider-preferences.usecase';
import type { UpdateProviderPreferencesUseCase } from '../../application/use-cases/update-provider-preferences.usecase';

describe('ProviderPreferencesController', () => {
	it('deve delegar catalogo, leitura e atualizacao das preferencias', async () => {
		const getProviderCatalogUseCase = {
			execute: jest.fn().mockReturnValue({
				image: [{ id: 'openai-image' }],
				audio: [{ id: 'openai-audio' }],
				video: [{ id: 'openai-video' }],
			}),
		} as unknown as jest.Mocked<GetProviderCatalogUseCase>;
		const getProviderPreferencesUseCase = {
			execute: jest
				.fn()
				.mockResolvedValueOnce({
					defaults: {
						imageProvider: 'openai-image',
						audioProvider: 'openai-audio',
						audioVoiceId: 'nova',
						videoProvider: 'openai-video',
						advancedSettings: {},
					},
					courseOverride: null,
					effective: {
						imageProvider: 'openai-image',
						audioProvider: 'openai-audio',
						audioVoiceId: 'nova',
						videoProvider: 'openai-video',
						advancedSettings: {},
					},
				})
				.mockResolvedValueOnce({
					defaults: {
						imageProvider: 'openai-image',
						audioProvider: 'openai-audio',
						audioVoiceId: 'nova',
						videoProvider: 'openai-video',
						advancedSettings: {},
					},
					courseOverride: null,
					effective: {
						imageProvider: 'openai-image',
						audioProvider: 'openai-audio',
						audioVoiceId: 'nova',
						videoProvider: 'openai-video',
						advancedSettings: {},
					},
				}),
		} as unknown as jest.Mocked<GetProviderPreferencesUseCase>;
		const updateProviderPreferencesUseCase = {
			execute: jest.fn().mockResolvedValue(undefined),
		} as unknown as jest.Mocked<UpdateProviderPreferencesUseCase>;
		const controller = new ProviderPreferencesController(
			getProviderCatalogUseCase,
			getProviderPreferencesUseCase,
			updateProviderPreferencesUseCase
		);
		const user = { id: 'user-1', email: 'user@example.com' } as never;

		expect(controller.getCatalog()).toEqual({
			image: [{ id: 'openai-image' }],
			audio: [{ id: 'openai-audio' }],
			video: [{ id: 'openai-video' }],
		});
		await expect(controller.getPreferences(user, 'course-1')).resolves.toEqual({
			defaults: {
				imageProvider: 'openai-image',
				audioProvider: 'openai-audio',
				audioVoiceId: 'nova',
				videoProvider: 'openai-video',
				advancedSettings: {},
			},
			courseOverride: null,
			effective: {
				imageProvider: 'openai-image',
				audioProvider: 'openai-audio',
				audioVoiceId: 'nova',
				videoProvider: 'openai-video',
				advancedSettings: {},
			},
		});
		await expect(
			controller.updatePreferences(user, {
				imageProvider: 'openai-image',
				audioProvider: 'openai-audio',
				audioVoiceId: 'nova',
				videoProvider: 'openai-video',
			})
		).resolves.toEqual({
			defaults: {
				imageProvider: 'openai-image',
				audioProvider: 'openai-audio',
				audioVoiceId: 'nova',
				videoProvider: 'openai-video',
				advancedSettings: {},
			},
			courseOverride: null,
			effective: {
				imageProvider: 'openai-image',
				audioProvider: 'openai-audio',
				audioVoiceId: 'nova',
				videoProvider: 'openai-video',
				advancedSettings: {},
			},
		});

		expect(getProviderPreferencesUseCase.execute).toHaveBeenNthCalledWith(1, {
			userId: 'user-1',
			courseId: 'course-1',
		});
		expect(updateProviderPreferencesUseCase.execute).toHaveBeenCalledWith({
			userId: 'user-1',
			selection: {
				imageProvider: 'openai-image',
				audioProvider: 'openai-audio',
				audioVoiceId: 'nova',
				videoProvider: 'openai-video',
				advancedSettings: {},
			},
		});
	});
});
