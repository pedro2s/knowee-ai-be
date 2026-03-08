---
name: knowee-nest-module-scaffold
description: Scaffold de módulos NestJS seguindo a arquitetura deste repo (application/use-cases/dtos, domain/ports/entities, infrastructure/controllers/persistence/drizzle e shared/database). Use quando o usuário pedir criação de módulo, endpoint, use-case, DTO, ports ou repository Drizzle, incluindo escolha entre `DbContext`/`DB_CONTEXT` (RLS) ou `DrizzleService` conforme o padrão do módulo-alvo, ou quando precisar registrar módulo no AppModule.
---

# Knowee NestJS Module Scaffold

## Quick start

1. Escolher o nome do módulo e o objetivo (ex.: `reports`, `notifications`).
2. Criar a estrutura de pastas seguindo os padrões do repo.
3. Criar DTOs, use-cases, ports e controllers conforme os exemplos existentes.
4. Implementar repositório Drizzle (quando houver persistência).
5. Registrar o módulo no `AppModule`.

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

## Exemplos de prompts

- "Cria um modulo `reports` com `ReportsController`, `GetReportUseCase`, `report.response.dto` e porta + repository Drizzle seguindo o padrao de `course-authoring`."
- "Adiciona endpoint `GET /courses` com guard, decorator `@CurrentUser` e response DTO no padrao do `CoursesController`."
- "Cria porta `REPORT_REPOSITORY` e implementacao `DrizzleReportRepository` usando `DbContext` e schema Drizzle, como em `drizzle-course.repository.ts`."
- "Registra o novo modulo no `AppModule` como em `src/app.module.ts`."

## Referencias locais a arquivos do repo

Ver `references/knowee-nestjs-architecture.md` para paths e exemplos reais.
