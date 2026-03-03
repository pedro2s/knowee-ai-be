import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@supabase/supabase-js';
import { SignInDto } from 'src/modules/auth/application/dtos/sign-in.dto';
import { SignUpDto } from 'src/modules/auth/application/dtos/sign-up.dto';
import { AuthServicePort } from 'src/modules/auth/domain/ports/auth.service.port';
import { DrizzleService } from 'src/shared/database/infrastructure/drizzle/drizzle.service';
import bcrypt from 'bcryptjs';
import { users } from 'src/shared/database/infrastructure/drizzle/schema/auth';
import { eq } from 'drizzle-orm';
import { UserPayload } from 'src/shared/types/user-payload';

@Injectable()
export class JwtAuthAdapter extends AuthServicePort {
	constructor(
		private readonly drizzle: DrizzleService,
		private readonly jwt: JwtService
	) {
		super();
	}

	async signIn(
		dto: SignInDto
	): Promise<{ access_token: string; refresh_token: string }> {
		const user = await this.drizzle.db.query.users.findFirst({
			where: eq(users.email, dto.email),
		});

		if (!user) {
			throw new UnauthorizedException('Credenciais inválidas');
		}

		const valid = await bcrypt.compare(dto.password, user.encryptedPassword);

		if (!valid) {
			throw new UnauthorizedException('Credenciais inválidas');
		}

		const payload = {
			sub: user.id,
			role: user.role,
		};

		const access_token = await this.jwt.signAsync(payload, { expiresIn: '1d' });
		const refresh_token = await this.jwt.signAsync(payload, {
			expiresIn: '7d',
		});

		return { access_token, refresh_token };
	}

	async signUp(dto: SignUpDto): Promise<{ user: UserPayload }> {
		const hashedPassword = await bcrypt.hash(dto.password, 10);

		const [user] = await this.drizzle.db
			.insert(users)
			.values({
				email: dto.email,
				encryptedPassword: hashedPassword,
				rawUserMetaData: {
					full_name: dto.fullName,
				},
			})
			.returning();

		return {
			user: {
				id: user.id,
				email: user.email,
				rawUserMetaData: user.rawUserMetaData,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			},
		};
	}

	async refreshSession(
		refreshToken: string
	): Promise<{ access_token: string; refresh_token: string }> {
		try {
			const payload = await this.jwt.verifyAsync(refreshToken);

			const newAccess = await this.jwt.signAsync({
				sub: payload.sub,
				role: payload.role,
			});

			return {
				access_token: newAccess,
				refresh_token: refreshToken,
			};
		} catch (error) {
			throw new UnauthorizedException('Refresh token inválido');
		}
	}

	async changePassword(input: {
		userId: string;
		email: string;
		currentPassword: string;
		newPassword: string;
	}): Promise<void> {
		const user = await this.drizzle.db.query.users.findFirst({
			where: eq(users.id, input.userId),
		});

		if (!user) throw new UnauthorizedException();

		const valid = await bcrypt.compare(
			input.currentPassword,
			user.encryptedPassword
		);

		if (!valid) {
			throw new UnauthorizedException('Senha atual inválida');
		}

		const hashed = await bcrypt.hash(input.newPassword, 10);

		await this.drizzle.db
			.update(users)
			.set({ encryptedPassword: hashed })
			.where(eq(users.id, user.id));
	}
}
