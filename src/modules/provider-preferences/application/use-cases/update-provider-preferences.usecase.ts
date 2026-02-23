import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { DrizzleProviderPreferencesRepository } from '../../infrastructure/persistence/drizzle/drizzle-provider-preferences.repository';
import { ProviderPreferenceSelection } from '../../domain/entities/provider-preferences.types';
import { ProviderCatalogService } from '../services/provider-catalog.service';

@Injectable()
export class UpdateProviderPreferencesUseCase {
	constructor(
		private readonly repository: DrizzleProviderPreferencesRepository,
		private readonly catalogService: ProviderCatalogService
	) {}

	async execute(input: {
		userId: string;
		selection: ProviderPreferenceSelection;
		courseId?: string;
	}): Promise<ProviderPreferenceSelection> {
		this.validateSelection(input.selection);

		if (input.courseId) {
			const ownsCourse = await this.repository.assertCourseOwnership(
				input.userId,
				input.courseId
			);

			if (!ownsCourse) {
				throw new NotFoundException('Curso não encontrado');
			}

			return this.repository.upsertCourseOverride(
				input.userId,
				input.courseId,
				input.selection
			);
		}

		return this.repository.upsertDefaults(input.userId, input.selection);
	}

	private validateSelection(selection: ProviderPreferenceSelection) {
		const catalog = this.catalogService.getCatalog();

		const image = catalog.image.find(
			(item) => item.id === selection.imageProvider
		);
		const audio = catalog.audio.find(
			(item) => item.id === selection.audioProvider
		);
		const video = catalog.video.find(
			(item) => item.id === selection.videoProvider
		);

		if (!image || image.status !== 'active') {
			throw new BadRequestException('Provider de imagem inválido/inativo');
		}
		if (!audio || audio.status !== 'active') {
			throw new BadRequestException('Provider de áudio inválido/inativo');
		}
		if (!video || video.status !== 'active') {
			throw new BadRequestException('Provider de vídeo inválido/inativo');
		}

		const voice = (audio.voices ?? []).find(
			(item) => item.voiceId === selection.audioVoiceId
		);

		if (!voice || voice.status !== 'active') {
			throw new BadRequestException('Voz inválida/inativa');
		}
	}
}
