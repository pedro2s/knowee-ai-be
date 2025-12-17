import { Injectable } from '@nestjs/common';
import { AuthServicePort } from '../../domain/ports/auth.service.port';
import { SignUpDto } from '../dtos/sign-up.dto';

@Injectable()
export class SignUpUseCase {
	constructor(private readonly authService: AuthServicePort) {}

	async execute(dto: SignUpDto) {
		return this.authService.signUp(dto);
	}
}
