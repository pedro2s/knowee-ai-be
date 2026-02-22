import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { UpdateProfileDto } from 'src/modules/profile/application/dtos/update-profile.dto';
import {
	ProfileData,
	ProfileRepositoryPort,
} from 'src/modules/profile/domain/ports/profile-repository.port';
import { DrizzleService } from 'src/shared/database/infrastructure/drizzle/drizzle.service';
import { profiles } from 'src/shared/database/infrastructure/drizzle/schema';

@Injectable()
export class DrizzleProfileRepository implements ProfileRepositoryPort {
	constructor(private readonly drizzle: DrizzleService) {}

	async findById(id: string): Promise<ProfileData | null> {
		const profile = await this.drizzle.db.query.profiles.findFirst({
			where: eq(profiles.id, id),
		});

		if (!profile) {
			return null;
		}

		return {
			id: profile.id,
			email: profile.email,
			fullName: profile.fullName,
			phone: profile.phone,
			company: profile.company,
			bio: profile.bio,
			avatarUrl: profile.avatarUrl,
		};
	}

	async upsert(input: {
		id: string;
		email: string;
		fullName?: string;
		updates?: UpdateProfileDto;
	}): Promise<ProfileData> {
		const [saved] = await this.drizzle.db
			.insert(profiles)
			.values({
				id: input.id,
				email: input.email,
				fullName: input.fullName,
				phone: input.updates?.phone,
				company: input.updates?.company,
				bio: input.updates?.bio,
				avatarUrl: input.updates?.avatarUrl,
			})
			.onConflictDoUpdate({
				target: profiles.id,
				set: {
					email: input.email,
					fullName: input.updates?.fullName ?? input.fullName,
					phone: input.updates?.phone,
					company: input.updates?.company,
					bio: input.updates?.bio,
					avatarUrl: input.updates?.avatarUrl,
					updatedAt: new Date().toISOString(),
				},
			})
			.returning();

		return {
			id: saved.id,
			email: saved.email,
			fullName: saved.fullName,
			phone: saved.phone,
			company: saved.company,
			bio: saved.bio,
			avatarUrl: saved.avatarUrl,
		};
	}
}
