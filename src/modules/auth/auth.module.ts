import { Module } from '@nestjs/common';
import { AuthController } from './infrastructure/controllers/auth.controller';
import { SignInUseCase } from './application/use-cases/sign-in.usecase';
import { SignUpUseCase } from './application/use-cases/sign-up.usecase';
import { AuthServicePort } from './domain/ports/auth.service.port';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './infrastructure/strategy/jwt.strategy';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.usecase';
import { ChangePasswordUseCase } from './application/use-cases/change-password.usecase';
import { BillingModule } from '../billing/billing.module';
import { JwtAuthAdapter } from './infrastructure/persistence/jwt/jwt-auth.adapter';
import { DatabaseModule } from 'src/shared/database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
	imports: [
		DatabaseModule,
		BillingModule,
		PassportModule.register({ defaultStrategy: 'jwt' }),
		JwtModule.registerAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				secret: configService.getOrThrow<string>('JWT_SECRET'),
			}),
		}),
	],
	controllers: [AuthController],
	providers: [
		SignInUseCase,
		SignUpUseCase,
		RefreshTokenUseCase,
		ChangePasswordUseCase,
		{ provide: AuthServicePort, useClass: JwtAuthAdapter },
		JwtStrategy,
	],
	exports: [AuthServicePort, JwtStrategy],
})
export class AuthModule {}
