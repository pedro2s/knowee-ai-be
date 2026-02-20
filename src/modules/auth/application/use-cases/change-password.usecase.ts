import { Inject, Injectable } from '@nestjs/common';
import { AuthServicePort } from '../../domain/ports/auth.service.port';
import { ChangePasswordDto } from '../dtos/change-password.dto';

@Injectable()
export class ChangePasswordUseCase {
	constructor(
		@Inject(AuthServicePort)
		private readonly authService: AuthServicePort
	) {}

	async execute(input: {
		userId: string;
		email: string;
		dto: ChangePasswordDto;
	}): Promise<void> {
		return this.authService.changePassword({
			userId: input.userId,
			email: input.email,
			currentPassword: input.dto.currentPassword,
			newPassword: input.dto.newPassword,
		});
	}
}
