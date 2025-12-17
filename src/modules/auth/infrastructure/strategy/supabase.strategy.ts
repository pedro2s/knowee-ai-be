import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SupabaseService } from 'src/shared/supabase/supabase.service';

interface SupabaseJwtPayload {
	access_token: string;
}

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'supabase') {
	constructor(
		private readonly supabaseService: SupabaseService,
		private readonly configService: ConfigService,
	) {
		const secret = configService.get<string>('SUPABASE_JWT_SECRET');
		if (!secret) {
			throw new Error('SUPABASE_JWT_SECRET is not defined');
		}
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: secret,
		});
	}

	async validate(payload: SupabaseJwtPayload) {
		const { data, error } = await this.supabaseService
			.getClient()
			.auth.getUser(payload.access_token);

		if (error) {
			throw new UnauthorizedException('Invalid token');
		}

		return data.user;
	}
}
