import { Body, Controller, Post } from '@nestjs/common';
import { SignInUseCase } from '../../application/use-cases/sign-in.usecase';
import { SignUpUseCase } from '../../application/use-cases/sign-up.usecase';
import { SignInDto } from '../../application/dtos/sign-in.dto';
import { SignUpDto } from '../../application/dtos/sign-up.dto';

@Controller('auth')
export class AuthController {
	constructor(
		private readonly signInUseCase: SignInUseCase,
		private readonly signUpUseCase: SignUpUseCase,
	) {}

	@Post('sign-in')
	async signIn(@Body() dto: SignInDto) {
		return this.signInUseCase.execute(dto);
	}

	@Post('sign-up')
	async signUp(@Body() dto: SignUpDto) {
		return this.signUpUseCase.execute(dto);
	}
}
