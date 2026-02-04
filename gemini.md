# Gemini Project Configuration

This document provides an overview of the project's technical stack, setup instructions, and a roadmap for future improvements.

## Stack Definition

This project is built with the following technologies:

- **Framework**: [NestJS](https://nestjs.com/) (v11) - A progressive Node.js framework for building efficient, reliable and scalable server-side applications.
- **Language**: [TypeScript](https://www.typescriptlang.org/) (v5)
- **Database**:
  - [PostgreSQL](https://www.postgresql.org/) - A powerful, open source object-relational database system.
  - [Drizzle ORM](https://orm.drizzle.team/) - A TypeScript ORM for SQL databases.
  - [pgvector](https://github.com/pgvector/pgvector) - Vector similarity search for PostgreSQL.
- **Authentication**:
  - [Supabase](https://supabase.com/) - Used for authentication and user management.
  - [Passport.js](http://www.passportjs.org/) - Authentication middleware for Node.js.
- **Artificial Intelligence**:
  - [Google Gemini](https://ai.google.dev/) - Google's family of multimodal AI models.
  - [OpenAI](https://openai.com/) - API for accessing OpenAI's models.
- **Linting & Formatting**:
  - [ESLint](https://eslint.org/) - For identifying and reporting on patterns found in ECMAScript/JavaScript code.
  - [Prettier](https://prettier.io/) - An opinionated code formatter.
- **Testing**: [Jest](https://jestjs.io/) - A delightful JavaScript Testing Framework with a focus on simplicity.
- **Git Hooks**: [Husky](https://typicode.github.io/husky/) - For managing git hooks.

## Execution Commands

To get the project running, follow these steps:

1.  **Install Dependencies**:

    ```bash
    npm install
    ```

2.  **Setup Environment Variables**:
    Create a `.env` file in the root of the project and add the necessary environment variables (e.g., database connection string, API keys).

3.  **Run Migrations**:

    ```bash
    npm run migration:run
    ```

4.  **Run the Application**:
    - For development with auto-reloading:
      ```bash
      npm run start:dev
      ```
    - For production:
      ```bash
      npm run build
      npm run start:prod
      ```

    The server will run on port `3000` by default, but this can be overridden by the `PORT` environment variable.

### Other useful commands

- **Linting**:
  ```bash
  npm run lint
  ```
- **Testing**:
  ```bash
  npm run test
  ```
- **Generate Migrations**:
  ```bash
  npm run migration:generate
  ```

## Roadmap de Melhorias (Future Enhancements)

Here are some suggestions for future improvements:

- **Configuration Management**:
  - Use NestJS's `ConfigModule` to manage environment variables in a more robust and type-safe way.

- **Testing Strategy**:
  - Increase test coverage, especially for e2e and integration tests.
  - Mock external services and APIs to make tests more reliable and faster.

- **CI/CD Pipeline**:
  - Implement a CI/CD pipeline (e.g., using GitHub Actions, GitLab CI) to automate testing, building, and deployment.

- **API Documentation**:
  - Integrate Swagger (`@nestjs/swagger`) to automatically generate API documentation.

- **Error Handling**:
  - Implement a more comprehensive global error handling strategy to provide consistent error responses.

- **Security**:
  - Add security enhancements like `helmet` for setting various HTTP headers.
  - Implement rate limiting to protect against brute-force attacks.

- **Logging**:
  - Integrate a structured logging solution (e.g., Winston, Pino) for better log management and analysis.

- **Code Quality**:
  - Continue to enforce and improve code quality with linting and formatting rules.
  - Maintain the modular structure of the application to ensure scalability and maintainability.
