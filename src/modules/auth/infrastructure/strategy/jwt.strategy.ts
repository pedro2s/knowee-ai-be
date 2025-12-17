import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
	sub: string;
	email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private readonly configService: ConfigService) {
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

	validate(payload: JwtPayload) {
		return { userId: payload.sub, email: payload.email };
	}
}
