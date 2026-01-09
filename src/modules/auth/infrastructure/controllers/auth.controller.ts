import { Body, Controller, Post, Get, UseGuards } from '@nestjs/common';
import { SignInUseCase } from '../../application/use-cases/sign-in.usecase';
import { SignUpUseCase } from '../../application/use-cases/sign-up.usecase';
import { SignInDto } from '../../application/dtos/sign-in.dto';
import { SignUpDto } from '../../application/dtos/sign-up.dto';
import { CurrentUser } from 'src/shared/infrastructure/decorators'; // Importar o novo decorator
import { SupabaseAuthGuard } from '../guards/supabase-auth.guard'; // Importar o guard
import type { UserPayload } from 'src/shared/domain/types/user-payload';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.usecase';
import { RefreshTokenDto } from '../../application/dtos/refresh-token.dto';

@Controller('auth')
export class AuthController {
	constructor(
		private readonly signInUseCase: SignInUseCase,
		private readonly signUpUseCase: SignUpUseCase,
		private readonly refreshTokenUseCase: RefreshTokenUseCase
	) {}

	@Post('sign-in')
	async signIn(@Body() dto: SignInDto) {
		return this.signInUseCase.execute(dto);
	}

	@Post('sign-up')
	async signUp(@Body() dto: SignUpDto) {
		return this.signUpUseCase.execute(dto);
	}

	@Post('refresh')
	async refresh(@Body() dto: RefreshTokenDto) {
		return this.refreshTokenUseCase.execute(dto);
	}

	@Get('profile')
	@UseGuards(SupabaseAuthGuard)
	async getProfile(@CurrentUser() user: UserPayload) {
		// O objeto 'user' agora contém as informações do usuário logado,
		// tipadas de acordo com a interface UserPayload.
		// Você pode retornar este objeto ou processá-lo conforme necessário.
		return user;
	}
}
