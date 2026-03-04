import { SignInDto } from '../../application/dtos/sign-in.dto';
import { SignUpDto } from '../../application/dtos/sign-up.dto';
import { UserPayload } from 'src/shared/types/user-payload';

export abstract class AuthServicePort {
	abstract signIn(
		dto: SignInDto
	): Promise<{ access_token: string; refresh_token: string }>;

	abstract signUp(dto: SignUpDto): Promise<{ user: UserPayload }>;

	abstract refreshSession(refreshToken: string): Promise<{
		access_token: string;
		refresh_token: string;
	}>;

	abstract changePassword(input: {
		userId: string;
		email: string;
		currentPassword: string;
		newPassword: string;
	}): Promise<void>;
}
