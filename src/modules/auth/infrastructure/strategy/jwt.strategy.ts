import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../../domain/domain/jwt-payload';
import { UserPayload } from 'src/shared/types/user-payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
	constructor(private readonly configService: ConfigService) {
		const secret = configService.get<string>('JWT_SECRET');
		if (!secret) {
			throw new Error('JWT_SECRET is not defined');
		}
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: secret,
		});
	}

	validate(payload: JwtPayload) {
		if (!payload.sub || !payload.email) {
			throw new UnauthorizedException('Invalid token payload');
		}

		return {
			id: payload.sub,
			email: payload.email,
			role: payload.role,
		} as UserPayload;
	}
}
