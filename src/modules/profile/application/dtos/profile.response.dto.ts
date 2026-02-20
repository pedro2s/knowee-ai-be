export class ProfileResponseDto {
	id: string;
	email: string | null;
	fullName: string | null;
	phone: string | null;
	company: string | null;
	bio: string | null;
	avatarUrl: string | null;

	static fromPersistence(input: {
		id: string;
		email: string | null;
		fullName: string | null;
		phone: string | null;
		company: string | null;
		bio: string | null;
		avatarUrl: string | null;
	}): ProfileResponseDto {
		return {
			id: input.id,
			email: input.email,
			fullName: input.fullName,
			phone: input.phone,
			company: input.company,
			bio: input.bio,
			avatarUrl: input.avatarUrl,
		};
	}
}
