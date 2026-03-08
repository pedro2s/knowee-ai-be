# Knowee NestJS Architecture References

## Estrutura de modulo

- `src/modules/<module>/application/dtos`
- `src/modules/<module>/application/use-cases`
- `src/modules/<module>/domain/ports`
- `src/modules/<module>/domain/entities`
- `src/modules/<module>/infrastructure/controllers`
- `src/modules/<module>/infrastructure/persistence/drizzle`

## Exemplos reais (paths)

- Controller:
  - `src/modules/course-authoring/infrastructure/controllers/courses.controller.ts`
- Use-case:
  - `src/modules/course-authoring/application/use-cases/generate-course.usecase.ts`
- Port:
  - `src/modules/course-authoring/domain/ports/course-repository.port.ts`
- Drizzle repository:
  - `src/modules/course-authoring/infrastructure/persistence/drizzle/drizzle-course.repository.ts`
- Guard:
  - `src/modules/auth/infrastructure/guards/jwt-auth.guard.ts`
- Decorator:
  - `src/shared/decorators/current-user.decorator.ts`
- AppModule:
  - `src/app.module.ts`
- DTOs com class-validator (e class-transformer quando necessário):
  - `src/modules/course-authoring/application/dtos/generate-course.dto.ts`
- Repositório com DbContext (RLS):
  - `src/modules/course-authoring/infrastructure/persistence/drizzle/drizzle-course.repository.ts`
- Repositório com DrizzleService:
  - `src/modules/profile/infrastructure/persistence/drizzle/drizzle-profile.repository.ts`

## Observacoes

- Autenticacao segue `JwtAuthGuard` + `@CurrentUser()`.
- Persistencia pode usar `DbContext` (`DB_CONTEXT` + `DrizzleRlsContext`) em `src/shared/database/infrastructure/drizzle/drizzle-rls.context.ts` ou `DrizzleService` direto, conforme padrão do módulo.
- DTOs usam `class-validator` e `class-transformer` quando necessário.
