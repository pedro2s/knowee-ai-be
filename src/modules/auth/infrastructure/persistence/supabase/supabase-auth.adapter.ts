import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthServicePort } from '../../../domain/ports/auth.service.port';
import { SignInDto } from '../../../application/dtos/sign-in.dto';
import { SignUpDto } from '../../../application/dtos/sign-up.dto';
import { User, AuthError, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from 'src/shared/supabase/subapase.constants';

@Injectable()
export class SupabaseAuthAdapter extends AuthServicePort {
	constructor(
		@Inject(SUPABASE_CLIENT)
		private readonly supabaseClient: SupabaseClient
	) {
		super();
	}

	async signIn(
		dto: SignInDto
	): Promise<{ access_token: string; refresh_token: string }> {
		const { email, password } = dto;
		const {
			data,
			error,
		}: {
			data: {
				session: { access_token: string; refresh_token: string } | null;
			};
			error: AuthError | null;
		} = await this.supabaseClient.auth.signInWithPassword({ email, password });

		if (error) {
			throw error;
		}

		if (!data.session) {
			throw new Error('Session not found');
		}

		const { access_token, refresh_token } = data.session;
		return { access_token, refresh_token };
	}

	async signUp(dto: SignUpDto): Promise<{ user: User }> {
		const { email, password, fullName } = dto;
		const {
			data,
			error,
		}: { data: { user: User | null }; error: AuthError | null } =
			await this.supabaseClient.auth.signUp({
				email,
				password,
				options: fullName
					? {
							data: {
								full_name: fullName,
							},
						}
					: undefined,
			});

		if (error) {
			throw error;
		}

		if (!data.user) {
			throw new Error('User not found');
		}

		return { user: data.user };
	}

	async refreshSession(refreshToken: string): Promise<{
		access_token: string;
		refresh_token: string;
	}> {
		const {
			data: { session },
			error,
		} = await this.supabaseClient.auth.refreshSession({
			refresh_token: refreshToken,
		});

		if (error) {
			throw error;
		}

		if (!session) {
			throw new Error('Session not found');
		}

		const { access_token, refresh_token } = session;
		return { access_token, refresh_token };
	}

	async changePassword(input: {
		userId: string;
		email: string;
		currentPassword: string;
		newPassword: string;
	}): Promise<void> {
		const verify = await this.supabaseClient.auth.signInWithPassword({
			email: input.email,
			password: input.currentPassword,
		});

		if (verify.error || !verify.data.user) {
			throw new UnauthorizedException('Senha atual inválida');
		}

		const update = await this.supabaseClient.auth.admin.updateUserById(
			input.userId,
			{
				password: input.newPassword,
			}
		);

		if (update.error) {
			throw update.error;
		}
	}
}
