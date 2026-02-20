import { Inject, Injectable } from '@nestjs/common';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import {
	PROFILE_REPOSITORY,
	type ProfileRepositoryPort,
} from '../../domain/ports/profile-repository.port';
import { ProfileResponseDto } from '../dtos/profile.response.dto';

@Injectable()
export class UpdateProfileUseCase {
	constructor(
		@Inject(PROFILE_REPOSITORY)
		private readonly profileRepository: ProfileRepositoryPort
	) {}

	async execute(input: {
		user: { id: string; email: string };
		dto: UpdateProfileDto;
	}): Promise<ProfileResponseDto> {
		const updated = await this.profileRepository.upsert({
			id: input.user.id,
			email: input.user.email,
			updates: input.dto,
		});

		return ProfileResponseDto.fromPersistence(updated);
	}
}
