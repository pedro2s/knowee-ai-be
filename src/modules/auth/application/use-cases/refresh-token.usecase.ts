import { Inject, Injectable } from '@nestjs/common';
import { AuthServicePort } from '../../domain/ports/auth.service.port';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';

@Injectable()
export class RefreshTokenUseCase {
	constructor(
		@Inject(AuthServicePort)
		private readonly authService: AuthServicePort,
	) {}

	async execute(
		dto: RefreshTokenDto,
	): Promise<{ access_token: string; refresh_token: string }> {
		return this.authService.refreshSession(dto.refreshToken);
	}
}
