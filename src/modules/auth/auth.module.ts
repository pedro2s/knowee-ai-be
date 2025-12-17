import { Module } from '@nestjs/common';
import { AuthController } from './infrastructure/controllers/auth.controller';
import { SignInUseCase } from './application/use-cases/sign-in.usecase';
import { SignUpUseCase } from './application/use-cases/sign-up.usecase';
import { AuthServicePort } from './domain/ports/auth.service.port';
import { SupabaseAuthAdapter } from './infrastructure/persistence/supabase/supabase-auth.adapter';
import { SupabaseModule } from 'src/shared/supabase/supabase.module';
import { PassportModule } from '@nestjs/passport';
import { SupabaseStrategy } from './infrastructure/strategy/supabase.strategy';
import { JwtStrategy } from './infrastructure/strategy/jwt.strategy';

@Module({
	imports: [
		SupabaseModule,
		PassportModule.register({ defaultStrategy: 'jwt' }),
	],
	controllers: [AuthController],
	providers: [
		SignInUseCase,
		SignUpUseCase,
		{
			provide: AuthServicePort,
			useClass: SupabaseAuthAdapter,
		},
		SupabaseStrategy,
		JwtStrategy,
	],
})
export class AuthModule {}
