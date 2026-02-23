import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { SupabaseClient } from '@supabase/supabase-js';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SUPABASE_CLIENT } from 'src/shared/supabase/subapase.constants';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'supabase') {
	constructor(
		@Inject(SUPABASE_CLIENT)
		private readonly supabaseClient: SupabaseClient,
		private readonly configService: ConfigService
	) {
		const secret = configService.get<string>('SUPABASE_JWT_SECRET');
		if (!secret) {
			throw new Error('SUPABASE_JWT_SECRET is not defined');
		}
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: secret,
			passReqToCallback: true,
		});
	}

	async validate(req: Request, payload: any) {
		const accessToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

		const { data, error } = await this.supabaseClient.auth.getUser(
			accessToken!
		);

		if (error) {
			throw new UnauthorizedException('Invalid token');
		}

		return data.user;
	}
}
