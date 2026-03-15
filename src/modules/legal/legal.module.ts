import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/shared/database/database.module';
import { AcceptCurrentLegalDocumentUseCase } from './application/use-cases/accept-current-legal-document.usecase';
import { CheckCurrentLegalAcceptanceUseCase } from './application/use-cases/check-current-legal-acceptance.usecase';
import { GetCurrentLegalDocumentUseCase } from './application/use-cases/get-current-legal-document.usecase';
import { GetMyLegalAcceptanceUseCase } from './application/use-cases/get-my-legal-acceptance.usecase';
import { LegalRepositoryPort } from './domain/ports/legal-repository.port';
import { LegalController } from './infrastructure/controllers/legal.controller';
import { LegalAcceptanceGuard } from './infrastructure/guards/legal-acceptance.guard';
import { DrizzleLegalRepository } from './infrastructure/persistence/drizzle/drizzle-legal.repository';

@Module({
	imports: [DatabaseModule],
	controllers: [LegalController],
	providers: [
		GetCurrentLegalDocumentUseCase,
		GetMyLegalAcceptanceUseCase,
		AcceptCurrentLegalDocumentUseCase,
		CheckCurrentLegalAcceptanceUseCase,
		LegalAcceptanceGuard,
		{
			provide: LegalRepositoryPort,
			useClass: DrizzleLegalRepository,
		},
	],
	exports: [CheckCurrentLegalAcceptanceUseCase, LegalAcceptanceGuard],
})
export class LegalModule {}
