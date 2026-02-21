import { User } from '@supabase/supabase-js';
import { SignInDto } from '../../application/dtos/sign-in.dto';
import { SignUpDto } from '../../application/dtos/sign-up.dto';

export abstract class AuthServicePort {
	abstract signIn(
		dto: SignInDto
	): Promise<{ access_token: string; refresh_token: string }>;

	abstract signUp(dto: SignUpDto): Promise<{ user: User }>;

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
