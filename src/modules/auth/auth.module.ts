import { Module } from '@nestjs/common';
import { AuthController } from './infrastructure/controllers/auth.controller';
import { SignInUseCase } from './application/use-cases/sign-in.usecase';
import { SignUpUseCase } from './application/use-cases/sign-up.usecase';
import { AuthServicePort } from './domain/ports/auth.service.port';
import { SupabaseAuthAdapter } from './infrastructure/persistence/supabase/supabase-auth.adapter';
import { SupabaseModule } from 'src/shared/infrastructure/supabase/supabase.module';
import { PassportModule } from '@nestjs/passport';
import { SupabaseStrategy } from './infrastructure/strategy/supabase.strategy';
import { JwtStrategy } from './infrastructure/strategy/jwt.strategy';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.usecase';

@Module({
	imports: [
		SupabaseModule,
		PassportModule.register({ defaultStrategy: 'jwt' }),
	],
	controllers: [AuthController],
	providers: [
		SignInUseCase,
		SignUpUseCase,
		RefreshTokenUseCase,
		{
			provide: AuthServicePort,
			useClass: SupabaseAuthAdapter,
		},
		SupabaseStrategy,
		JwtStrategy,
	],
})
export class AuthModule {}
