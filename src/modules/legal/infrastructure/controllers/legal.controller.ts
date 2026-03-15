import {
	Body,
	Controller,
	Get,
	Post,
	Query,
	Req,
	UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from 'src/modules/auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from 'src/shared/decorators';
import type { UserPayload } from 'src/shared/types/user-payload';
import { AcceptLegalDocumentRequestDto } from '../../application/dtos/accept-legal-document.request.dto';
import { GetCurrentLegalDocumentQueryDto } from '../../application/dtos/get-current-legal-document.query.dto';
import { LegalAcceptanceStatusResponseDto } from '../../application/dtos/legal-acceptance-status.response.dto';
import { LegalDocumentResponseDto } from '../../application/dtos/legal-document.response.dto';
import { AcceptCurrentLegalDocumentUseCase } from '../../application/use-cases/accept-current-legal-document.usecase';
import { GetCurrentLegalDocumentUseCase } from '../../application/use-cases/get-current-legal-document.usecase';
import { GetMyLegalAcceptanceUseCase } from '../../application/use-cases/get-my-legal-acceptance.usecase';

@Controller('legal')
export class LegalController {
	constructor(
		private readonly getCurrentLegalDocumentUseCase: GetCurrentLegalDocumentUseCase,
		private readonly getMyLegalAcceptanceUseCase: GetMyLegalAcceptanceUseCase,
		private readonly acceptCurrentLegalDocumentUseCase: AcceptCurrentLegalDocumentUseCase
	) {}

	@Get('documents/current')
	async getCurrentDocument(
		@Query() query: GetCurrentLegalDocumentQueryDto
	): Promise<LegalDocumentResponseDto> {
		const document = await this.getCurrentLegalDocumentUseCase.execute(
			query.type
		);
		return LegalDocumentResponseDto.fromDomain(document);
	}

	@Get('acceptances/me')
	@UseGuards(JwtAuthGuard)
	async getMyAcceptance(
		@CurrentUser() user: UserPayload
	): Promise<LegalAcceptanceStatusResponseDto> {
		const status = await this.getMyLegalAcceptanceUseCase.execute(
			user.id,
			'terms_of_use'
		);
		return LegalAcceptanceStatusResponseDto.fromDomain(status);
	}

	@Post('acceptances/me')
	@UseGuards(JwtAuthGuard)
	async acceptCurrentDocument(
		@CurrentUser() user: UserPayload,
		@Body() body: AcceptLegalDocumentRequestDto,
		@Req() request: Request
	): Promise<LegalAcceptanceStatusResponseDto> {
		const status = await this.acceptCurrentLegalDocumentUseCase.execute({
			userId: user.id,
			documentType: body.documentType,
			source: body.source ?? 'first_access_gate',
			userAgent: request.headers['user-agent'] ?? null,
			ipAddress: request.ip ?? null,
		});

		return LegalAcceptanceStatusResponseDto.fromDomain(status);
	}
}
