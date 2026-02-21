import { Inject, Injectable } from '@nestjs/common';
import {
	PROFILE_REPOSITORY,
	type ProfileRepositoryPort,
} from '../../domain/ports/profile-repository.port';
import { ProfileResponseDto } from '../dtos/profile.response.dto';

@Injectable()
export class GetProfileUseCase {
	constructor(
		@Inject(PROFILE_REPOSITORY)
		private readonly profileRepository: ProfileRepositoryPort
	) {}

	async execute(user: {
		id: string;
		email: string;
	}): Promise<ProfileResponseDto> {
		const existing = await this.profileRepository.findById(user.id);

		if (existing) {
			return ProfileResponseDto.fromPersistence(existing);
		}

		const created = await this.profileRepository.upsert({
			id: user.id,
			email: user.email,
		});
		return ProfileResponseDto.fromPersistence(created);
	}
}
