import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/shared/infrastructure/database/database.module';
import { ProfileController } from './infrastructure/controllers/profile.controller';
import { GetProfileUseCase } from './application/use-cases/get-profile.usecase';
import { UpdateProfileUseCase } from './application/use-cases/update-profile.usecase';
import { PROFILE_REPOSITORY } from './domain/ports/profile-repository.port';
import { DrizzleProfileRepository } from './infrastructure/persistence/drizzle/drizzle-profile.repository';

@Module({
	imports: [DatabaseModule],
	controllers: [ProfileController],
	providers: [
		GetProfileUseCase,
		UpdateProfileUseCase,
		{
			provide: PROFILE_REPOSITORY,
			useClass: DrizzleProfileRepository,
		},
	],
})
export class ProfileModule {}
