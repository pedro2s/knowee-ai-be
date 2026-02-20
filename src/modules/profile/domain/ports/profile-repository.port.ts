import { UpdateProfileDto } from '../../application/dtos/update-profile.dto';

export const PROFILE_REPOSITORY = 'PROFILE_REPOSITORY';

export interface ProfileData {
	id: string;
	email: string | null;
	fullName: string | null;
	phone: string | null;
	company: string | null;
	bio: string | null;
	avatarUrl: string | null;
}

export interface ProfileRepositoryPort {
	findById(id: string): Promise<ProfileData | null>;
	upsert(input: {
		id: string;
		email: string;
		fullName?: string;
		updates?: UpdateProfileDto;
	}): Promise<ProfileData>;
}
