import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Definir uma interface para o payload do usuário que será anexado à requisição.
// Você pode ajustar esta interface para refletir a estrutura real do seu objeto de usuário.
interface UserPayload {
  id: string;
  email: string;
  // Adicione outras propriedades do usuário conforme necessário
}

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
  },
);
