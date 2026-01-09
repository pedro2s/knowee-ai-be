import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserPayload } from 'src/shared/domain/types/user-payload';

/**
 * Decorator para injetar o usuário logado no método do controller.
 * Assume que um guard de autenticação (ex: SupabaseAuthGuard)
 * já anexou o objeto do usuário à requisição (req.user).
 *
 * Exemplo de uso:
 * @UseGuards(SupabaseAuthGuard)
 * @Get('profile')
 * getProfile(@CurrentUser() user: UserPayload) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
	(data: unknown, ctx: ExecutionContext): UserPayload => {
		const request = ctx.switchToHttp().getRequest();
		return request.user;
	}
);
