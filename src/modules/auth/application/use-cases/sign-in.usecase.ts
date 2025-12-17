import { Injectable } from '@nestjs/common';
import { AuthServicePort } from '../../domain/ports/auth.service.port';
import { SignInDto } from '../dtos/sign-in.dto';

@Injectable()
export class SignInUseCase {
	constructor(private readonly authService: AuthServicePort) {}

	async execute(dto: SignInDto) {
		return this.authService.signIn(dto);
	}
}
