import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UpdateProviderPreferencesUseCase } from './update-provider-preferences.usecase';
import type { DrizzleProviderPreferencesRepository } from '../../infrastructure/persistence/drizzle/drizzle-provider-preferences.repository';
import type { ProviderCatalogService } from '../services/provider-catalog.service';

describe('UpdateProviderPreferencesUseCase', () => {
	const selection = {
		imageProvider: 'openai-image',
		audioProvider: 'openai-audio',
		audioVoiceId: 'nova',
		videoProvider: 'openai-video',
		advancedSettings: {},
	};

	const catalog = {
		image: [
			{
				id: 'openai-image',
				status: 'active',
			},
		],
		audio: [
			{
				id: 'openai-audio',
				status: 'active',
				voices: [
					{
						voiceId: 'nova',
						status: 'active',
					},
				],
			},
		],
		video: [
			{
				id: 'openai-video',
				status: 'active',
			},
		],
	} as never;

	function build() {
		const repository = {
			assertCourseOwnership: jest.fn(),
			upsertCourseOverride: jest.fn(),
			upsertDefaults: jest.fn(),
		} as unknown as jest.Mocked<DrizzleProviderPreferencesRepository>;
		const catalogService = {
			getCatalog: jest.fn().mockReturnValue(catalog),
		} as unknown as jest.Mocked<ProviderCatalogService>;

		return {
			repository,
			catalogService,
			useCase: new UpdateProviderPreferencesUseCase(repository, catalogService),
		};
	}

	it('deve atualizar defaults quando nao houver courseId', async () => {
		const { useCase, repository } = build();
		repository.upsertDefaults.mockResolvedValue(selection);

		await expect(
			useCase.execute({ userId: 'user-1', selection })
		).resolves.toEqual(selection);
		expect(repository.upsertDefaults).toHaveBeenCalledWith('user-1', selection);
	});

	it('deve atualizar override do curso quando houver ownership', async () => {
		const { useCase, repository } = build();
		repository.assertCourseOwnership.mockResolvedValue(true);
		repository.upsertCourseOverride.mockResolvedValue(selection);

		await expect(
			useCase.execute({
				userId: 'user-1',
				courseId: 'course-1',
				selection,
			})
		).resolves.toEqual(selection);
		expect(repository.upsertCourseOverride).toHaveBeenCalledWith(
			'user-1',
			'course-1',
			selection
		);
	});

	it('deve falhar quando o curso nao pertencer ao usuario', async () => {
		const { useCase, repository } = build();
		repository.assertCourseOwnership.mockResolvedValue(false);

		await expect(
			useCase.execute({
				userId: 'user-1',
				courseId: 'course-1',
				selection,
			})
		).rejects.toThrow(NotFoundException);
	});

	it('deve falhar quando provider de imagem for invalido', async () => {
		const { useCase } = build();

		await expect(
			useCase.execute({
				userId: 'user-1',
				selection: { ...selection, imageProvider: 'unknown' },
			})
		).rejects.toThrow(BadRequestException);
	});

	it('deve falhar quando voz for invalida ou inativa', async () => {
		const { useCase, catalogService } = build();
		catalogService.getCatalog.mockReturnValue({
			...catalog,
			audio: [
				{
					id: 'openai-audio',
					status: 'active',
					voices: [{ voiceId: 'nova', status: 'disabled' }],
				},
			],
		} as never);

		await expect(
			useCase.execute({
				userId: 'user-1',
				selection,
			})
		).rejects.toThrow(BadRequestException);
	});
});
