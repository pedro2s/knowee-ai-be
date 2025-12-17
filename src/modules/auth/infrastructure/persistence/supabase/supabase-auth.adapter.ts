import { Injectable } from '@nestjs/common';
import { AuthServicePort } from '../../../domain/ports/auth.service.port';
import { SupabaseService } from 'src/shared/supabase/supabase.service';
import { SignInDto } from '../../../application/dtos/sign-in.dto';
import { SignUpDto } from '../../../application/dtos/sign-up.dto';
import { User, AuthError } from '@supabase/supabase-js';

@Injectable()
export class SupabaseAuthAdapter extends AuthServicePort {
	constructor(private readonly supabaseService: SupabaseService) {
		super();
	}

	async signIn(
		dto: SignInDto,
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
		} = await this.supabaseService
			.getClient()
			.auth.signInWithPassword({ email, password });

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
		const { email, password } = dto;
		const {
			data,
			error,
		}: { data: { user: User | null }; error: AuthError | null } =
			await this.supabaseService
				.getClient()
				.auth.signUp({ email, password });

		if (error) {
			throw error;
		}

		if (!data.user) {
			throw new Error('User not found');
		}

		return { user: data.user };
	}
}
