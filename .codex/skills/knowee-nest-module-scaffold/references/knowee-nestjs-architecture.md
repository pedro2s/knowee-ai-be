# Knowee NestJS Architecture References

## Estrutura de modulo

- `src/modules/<module>/application/dtos`
- `src/modules/<module>/application/use-cases`
- `src/modules/<module>/domain/ports`
- `src/modules/<module>/domain/entities`
- `src/modules/<module>/infrastructure/controllers`
- `src/modules/<module>/infrastructure/persistence/drizzle`

## Padrao de DI interno

- Ports internas do projeto usam `abstract class` como contrato e token do Nest.
- Implementacoes concretas usam `implements` quando a port nao traz comportamento compartilhado.
- O modulo registra providers como `{ provide: XPort, useClass: Impl }`.
- Consumidores internos preferem injecao por tipo no construtor.
- `@Inject(...)` fica restrito a tokens externos e casos especiais.

Exemplo resumido:

```ts
export abstract class ReportRepositoryPort {
	abstract findById(id: string): Promise<Report | null>;
}

@Injectable()
export class DrizzleReportRepository implements ReportRepositoryPort {
	constructor(@Inject(DB_CONTEXT) private readonly dbContext: DbContext) {}

	async findById(id: string): Promise<Report | null> {
		// ...
	}
}

@Injectable()
export class GetReportUseCase {
	constructor(private readonly reportRepository: ReportRepositoryPort) {}
}
```

Excecoes ao padrao:

- `DB_CONTEXT`
- `OPENAI_CLIENT`
- `STRIPE_CLIENT`
- `SUPABASE_CLIENT`
- aliases/factories e providers dinamicos

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
- Port abstrata + injecao por tipo:
  - `src/modules/profile/domain/ports/profile-repository.port.ts`
  - `src/modules/profile/application/use-cases/get-profile.usecase.ts`
- Repository com provider class-based:
  - `src/modules/profile/profile.module.ts`
  - `src/modules/access-control/access-control.module.ts`
- Teste de use-case:
  - `src/modules/profile/application/use-cases/get-profile.usecase.spec.ts`
- Teste de controller:
  - `src/modules/profile/infrastructure/controllers/profile.controller.spec.ts`
- Teste de service/guard:
  - `src/modules/access-control/application/services/access-policy.service.spec.ts`
  - `src/modules/access-control/infrastructure/guards/product-access.guard.spec.ts`
- Teste e2e base:
  - `test/app.e2e-spec.ts`

## Observacoes

- Autenticacao segue `JwtAuthGuard` + `@CurrentUser()`.
- Persistencia pode usar `DbContext` (`DB_CONTEXT` + `DrizzleRlsContext`) em `src/shared/database/infrastructure/drizzle/drizzle-rls.context.ts` ou `DrizzleService` direto, conforme padrão do módulo.
- DTOs usam `class-validator` e `class-transformer` quando necessário.
- Ao criar scaffold de modulo, prefira incluir pelo menos testes unitarios de use-case e controller no mesmo pacote do codigo alterado.
- Validar alteracoes de `api` com:
  - `npm run test -- --runInBand`
  - `npm run test:cov -- --runInBand`
