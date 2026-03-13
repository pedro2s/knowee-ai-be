---
name: knowee-nest-module-scaffold
description: Scaffold de módulos NestJS seguindo a arquitetura deste repo (application/use-cases/dtos, domain/ports/entities, infrastructure/controllers/persistence/drizzle e shared/database). Use quando o usuário pedir criação de módulo, endpoint, use-case, DTO, ports ou repository Drizzle, incluindo escolha entre `DbContext`/`DB_CONTEXT` (RLS) ou `DrizzleService` conforme o padrão do módulo-alvo, quando precisar registrar módulo no AppModule, ou quando for necessário manter os testes unitários/controller alinhados com o scaffold e com a cobertura do projeto.
---

# Knowee NestJS Module Scaffold

## Quick start

1. Escolher o nome do módulo e o objetivo (ex.: `reports`, `notifications`).
2. Criar a estrutura de pastas seguindo os padrões do repo.
3. Criar DTOs, use-cases, ports abstratas e controllers conforme os exemplos existentes.
4. Implementar repository/adapter concreto com provider class-based no módulo.
5. Criar ou ajustar testes unitários de use-case e controller; adicionar e2e apenas quando o escopo exigir wiring HTTP relevante.
6. Registrar o módulo no `AppModule`.

Referências locais: ver `references/knowee-nestjs-architecture.md`.

## Checklist de scaffold

- `src/modules/<module>/` criado com subpastas:
  - `application/dtos/`
  - `application/use-cases/`
  - `domain/ports/`
  - `domain/entities/` (se houver entidades)
  - `infrastructure/controllers/`
  - `infrastructure/persistence/drizzle/` (se houver persistência)
- Controller com rotas e guards conforme padrão do repo.
- DTOs com `class-validator` sempre e `class-transformer` quando necessário.
- Ports internas declaradas como `abstract class`, sem token string próprio.
- Implementações concretas usando `implements`, não `extends`, quando a port for contrato puro.
- Módulo registrando providers class-based como `{ provide: XPort, useClass: Impl }`.
- Consumidores injetando por tipo `constructor(private readonly dep: XPort) {}` sempre que não houver ambiguidade.
- `@Inject(...)` reservado para tokens externos, alias/factories ou ambiguidades reais.
- Repositório Drizzle seguindo o padrão do módulo-alvo (`DbContext`/`DB_CONTEXT` para RLS ou `DrizzleService` para acesso direto).
- Testes `.spec.ts` para use-cases e controllers novos ou alterados.
- Validar com `npm run test -- --runInBand` e `npm run test:cov -- --runInBand` quando a mudança tocar código da `api`.
- Módulo registrado no `src/app.module.ts`.

## Padroes de controller (guards, CurrentUser, DTO, response)

- Usar `@UseGuards(JwtAuthGuard)` quando o endpoint exige autenticacao.
- Injetar usuario com `@CurrentUser()` e tipar `UserPayload`.
- Usar DTOs nos inputs e Response DTOs nos outputs.
- Converter entidades de dominio para DTOs usando `fromDomain` quando existir.

Exemplo de referencia: `src/modules/course-authoring/infrastructure/controllers/courses.controller.ts`.

## Padroes de use-case (DI, exceptions, retorno)

- Use-case como `@Injectable()`.
- Injetar ports internas por tipo quando o provider usar a classe abstrata como token.
- Usar `@Inject(...)` apenas com tokens explícitos, como `DB_CONTEXT`, `OPENAI_CLIENT`, `STRIPE_CLIENT` e equivalentes.
- Usar exceptions de Nest (`NotFoundException`, etc.) conforme necessario.
- Retornar tipos simples ou DTOs conforme a camada de controller.

Exemplo de referencia: `src/modules/course-authoring/application/use-cases/generate-course.usecase.ts`.

## Padroes de ports e repository Drizzle

- Declarar ports internas como contrato de DI e domínio:

```ts
export abstract class ReportRepositoryPort {
	abstract findById(id: string): Promise<Report | null>;
}
```

- Implementação concreta deve satisfazer o contrato com `implements`:

```ts
export class DrizzleReportRepository implements ReportRepositoryPort {
	async findById(id: string): Promise<Report | null> {
		// ...
	}
}
```

- Registrar no módulo com provider class-based:

```ts
providers: [
	{
		provide: ReportRepositoryPort,
		useClass: DrizzleReportRepository,
	},
];
```

- Consumir por tipo:

```ts
constructor(private readonly reportRepository: ReportRepositoryPort) {}
```

- Para módulos com RLS/autorização por usuário, preferir `@Inject(DB_CONTEXT)`, tipar com `DbContext` e usar `this.dbContext.runAsUser`.
- Para módulos sem RLS contextual, pode usar `DrizzleService` diretamente.
- Usar schema de `src/shared/database/infrastructure/drizzle/schema`.
- Retornar `null` quando nao encontrado, mantendo contratos do port.

Exemplos de referencia:

- `src/modules/course-authoring/infrastructure/persistence/drizzle/drizzle-course.repository.ts` (padrão com `DbContext`)
- `src/modules/profile/infrastructure/persistence/drizzle/drizzle-profile.repository.ts` (padrão com `DrizzleService`)

## Registro no AppModule

- Importar o modulo no `src/app.module.ts`.
- Adicionar no array `imports`.

Exemplo de referencia: `src/app.module.ts`.

## Padroes de teste e cobertura

- Para novos use-cases, criar `*.usecase.spec.ts` ao lado do arquivo testando fluxo feliz e falhas relevantes com mocks tipados das ports abstratas.
- Para novos controllers, criar `*.controller.spec.ts` cobrindo delegacao para use-cases, `@CurrentUser()` e mapeamento basico de DTOs/respostas sem depender de `TestingModule` quando nao for necessario.
- Adicionar teste e2e em `test/` apenas quando houver comportamento HTTP integrado, pipes/guards/interceptors ou wiring de modulo que nao fique bem coberto em unit tests.
- Preferir assertions sobre comportamento observável e chamadas de porta, não sobre detalhes internos.
- Usar `npm run test -- --runInBand` para validacao rapida e `npm run test:cov -- --runInBand` para inspecionar cobertura.
- Ao scaffoldar, nao deixar codigo novo sem testes quando houver logica de negocio, contrato de controller ou regra de autorizacao.

Exemplos de referencia:

- `src/modules/profile/application/use-cases/get-profile.usecase.spec.ts`
- `src/modules/profile/infrastructure/controllers/profile.controller.spec.ts`
- `src/modules/access-control/application/services/access-policy.service.spec.ts`
- `test/app.e2e-spec.ts`

## Exemplos de prompts

- "Cria um modulo `reports` com `ReportsController`, `GetReportUseCase`, `report.response.dto` e `ReportRepositoryPort` abstrata + `DrizzleReportRepository` seguindo o padrao de `course-authoring`."
- "Adiciona endpoint `GET /courses` com guard, decorator `@CurrentUser` e response DTO no padrao do `CoursesController`."
- "Cria `ReportRepositoryPort` como classe abstrata e `DrizzleReportRepository` usando `DbContext` e schema Drizzle, como em `drizzle-course.repository.ts`."
- "Registra o novo modulo no `AppModule` como em `src/app.module.ts`."
- "Cria o modulo `reports` com controller, use-case, repository e os testes `.spec.ts` necessarios seguindo os padroes de `profile` e valida com cobertura."

## Referencias locais a arquivos do repo

Ver `references/knowee-nestjs-architecture.md` para paths e exemplos reais.
