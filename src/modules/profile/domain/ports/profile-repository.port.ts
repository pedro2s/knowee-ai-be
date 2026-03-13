import { UpdateProfileDto } from '../../application/dtos/update-profile.dto';

export interface ProfileData {
	id: string;
	email: string | null;
	fullName: string | null;
	phone: string | null;
	company: string | null;
	bio: string | null;
	avatarUrl: string | null;
}

export abstract class ProfileRepositoryPort {
	abstract findById(id: string): Promise<ProfileData | null>;
	abstract upsert(input: {
		id: string;
		email: string;
		fullName?: string;
		updates?: UpdateProfileDto;
	}): Promise<ProfileData>;
}
