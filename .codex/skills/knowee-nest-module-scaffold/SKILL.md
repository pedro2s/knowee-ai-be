---
name: knowee-nest-module-scaffold
description: Scaffold de módulos NestJS seguindo a arquitetura deste repo (application/use-cases/dtos, domain/ports/entities, infrastructure/controllers/persistence/drizzle e shared/database). Use quando o usuário pedir criação de módulo, endpoint, use-case, DTO, ports ou repository Drizzle, incluindo escolha entre `DbContext`/`DB_CONTEXT` (RLS) ou `DrizzleService` conforme o padrão do módulo-alvo, quando precisar registrar módulo no AppModule, ou quando for necessário manter os testes unitários/controller alinhados com o scaffold e com a cobertura do projeto.
---

# Knowee NestJS Module Scaffold

## Quick start

1. Escolher o nome do módulo e o objetivo (ex.: `reports`, `notifications`).
2. Criar a estrutura de pastas seguindo os padrões do repo.
3. Criar DTOs, use-cases, ports e controllers conforme os exemplos existentes.
4. Implementar repositório Drizzle (quando houver persistência).
5. Criar/ajustar testes unitários do use-case e controller; adicionar e2e quando o escopo envolver wiring HTTP relevante.
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
- Use-cases com `@Inject` de ports e retorno tipado.
- Portas declaradas com `const <NAME>_REPOSITORY` exportado.
- Repositório Drizzle seguindo o padrão do módulo-alvo (`DbContext`/`DB_CONTEXT` para RLS ou `DrizzleService` para acesso direto).
- Testes `.spec.ts` para use-cases e controllers novos ou alterados.
- Verificação de cobertura com `npm run test:cov` quando a mudança justificar; atualmente o repo gera cobertura, mas não define `coverageThreshold` global no `package.json`.
- Módulo registrado no `src/app.module.ts`.

## Padroes de controller (guards, CurrentUser, DTO, response)

- Usar `@UseGuards(JwtAuthGuard)` quando o endpoint exige autenticacao.
- Injetar usuario com `@CurrentUser()` e tipar `UserPayload`.
- Usar DTOs nos inputs e Response DTOs nos outputs.
- Converter entidades de dominio para DTOs usando `fromDomain` quando existir.

Exemplo de referencia: `src/modules/course-authoring/infrastructure/controllers/courses.controller.ts`.

## Padroes de use-case (Inject ports, exceptions, retorno)

- Use-case como `@Injectable()`.
- Injetar ports via token (ex.: `@Inject(COURSE_REPOSITORY)`), tipar com interface.
- Usar exceptions de Nest (`NotFoundException`, etc.) conforme necessario.
- Retornar tipos simples ou DTOs conforme a camada de controller.

Exemplo de referencia: `src/modules/course-authoring/application/use-cases/generate-course.usecase.ts`.

## Padroes de repository Drizzle (DbContext/DB_CONTEXT ou DrizzleService)

- Implementar interface do port.
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

- Para novos use-cases, criar `*.usecase.spec.ts` ao lado do arquivo testando fluxo feliz e falhas relevantes com mocks tipados das ports.
- Para novos controllers, criar `*.controller.spec.ts` cobrindo delegacao para use-cases, `@CurrentUser()` e mapeamento basico de DTOs/respostas sem depender de `TestingModule` quando nao for necessario.
- Adicionar teste e2e em `test/` apenas quando houver comportamento HTTP integrado, pipes/guards/interceptors ou wiring de modulo que nao fique bem coberto em unit tests.
- Usar `npm run test` para validacao rapida e `npm run test:cov` para inspecionar cobertura; o projeto publica a cobertura em `coverage/`, mas nao falha por threshold global configurado no momento.
- Ao scaffoldar, nao deixar codigo novo sem testes quando houver logica de negocio, contrato de controller ou regra de autorizacao.

Exemplos de referencia:

- `src/modules/profile/application/use-cases/get-profile.usecase.spec.ts`
- `src/modules/profile/infrastructure/controllers/profile.controller.spec.ts`
- `test/app.e2e-spec.ts`

## Exemplos de prompts

- "Cria um modulo `reports` com `ReportsController`, `GetReportUseCase`, `report.response.dto` e porta + repository Drizzle seguindo o padrao de `course-authoring`."
- "Adiciona endpoint `GET /courses` com guard, decorator `@CurrentUser` e response DTO no padrao do `CoursesController`."
- "Cria porta `REPORT_REPOSITORY` e implementacao `DrizzleReportRepository` usando `DbContext` e schema Drizzle, como em `drizzle-course.repository.ts`."
- "Registra o novo modulo no `AppModule` como em `src/app.module.ts`."
- "Cria o modulo `reports` com controller, use-case, repository e os testes `.spec.ts` necessarios seguindo os padroes de `profile` e valida com cobertura."

## Referencias locais a arquivos do repo

Ver `references/knowee-nestjs-architecture.md` para paths e exemplos reais.
