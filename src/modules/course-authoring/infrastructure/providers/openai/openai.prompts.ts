import type { OpenAI } from 'openai';
import { CourseDetails } from 'src/modules/course-authoring/domain/ports/course-generator.port';

export function buildCoursePrompt(
	courseDetails: CourseDetails,
	filesAnalysis: string,
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
	const {
		// dados básicos do curso
		title,
		description,
		category,
		level,
		duration,
		targetAudience,
		objectives,
		// dados personalizados baseados no nível
		mainGoal,
		essentialTopics,
		examplesCases,
		courseType,
		includeAssessments,
		includeProjects,
		// perfil do instrutor
		instructorName,
		instructorLevel,
		instructorArea,
		teachingExperience,
		instructorAchievements,
		typicalAudience,
		instructorMotivation,
		preferredFormats,
	} = courseDetails;

	return [
		{
			role: 'system',
			content: `Você é um especialista em design instrucional e criação de cursos online.
Sua missão é criar um curso completo, estruturado e personalizado baseado no perfil único do instrutor e nas especificações fornecidas.
Responda apenas a perguntas relacionadas à concepção, estruturação, planejamento, produção e melhoria de cursos.
Ignore ou recuse perguntas que não estejam diretamente relacionadas à criação de cursos.`,
		},
		{
			role: 'user',
			content: [
				{
					type: 'text',
					text: `Com base nas informações a seguir, gere um JSON COMPLETO, com toda a estrutura de um curso para ser carregado em uma interface de edição de cursos.`,
				},
				{
					type: 'text',
					text: `Dados do Instrutor:
Nome: ${instructorName}
Área de Atuação: ${instructorArea}
Nível de Experiência como Instrutor: ${instructorLevel}
Experiência em Ensino: ${teachingExperience}
Principais Conquistas: ${instructorAchievements}
Público Típico: ${typicalAudience}
Motivação para Criar o Curso: ${instructorMotivation}
Formatos Preferidos: ${preferredFormats}`,
				},
				{
					type: 'text',
					text: `Especificações do Curso:
Título: ${title}
Descrição: ${description}
Categoria: ${category}
Nível do Curso: ${level}
Público-alvo Específico: ${targetAudience}
Objetivos de Aprendizagem: ${objectives}
Duração Estimada: ${duration}`,
				},
				{
					type: 'text',
					text: `Personalização Baseada no Perfil do Instrutor

Para Instrutor Iniciante:
- Objetivo Principal: ${mainGoal}
- Tópicos Essenciais: ${essentialTopics}
- Exemplos e Histórias: ${examplesCases}

Para Instrutor Intermediário:

- Tópicos para Aprofundar: ${essentialTopics}
- Recursos e Ferramentas Atuais: ${examplesCases}
- Estrutura de Aprendizado Preferida: ${mainGoal}

Para Instrutor Avançado:

- Metodologias Pedagógicas: ${mainGoal}
- Cases Reais e Projetos Complexos: ${examplesCases}
- Trilhas Especializadas: ${essentialTopics}`,
				},
				{
					type: 'text',
					text: `Configurações Adicionais

Tipo de Curso (teórico/prático/misto): ${courseType}
Incluir Avaliações: ${includeAssessments}
Incluir Projetos Práticos: ${includeProjects}
Materiais de Referência (análise dos arquivos enviados): ${filesAnalysis}`,
				},
				{
					type: 'text',
					text: `Instruções para Criação do Curso

1. ANÁLISE E ADAPTAÇÃO DO TOM
- Adapte o tom de voz baseado no perfil do instrutor:

    - Iniciante: Tom encorajador, didático, com explicações detalhadas
    - Intermediário: Tom profissional, confiante, com foco em aplicação prática
    - Avançado: Tom especializado, sofisticado, com terminologia técnica apropriada


- Incorpore a personalidade do instrutor através de:

    - Suas conquistas e credenciais nas introduções
    - Sua motivação nos objetivos do curso
    - Seu estilo de ensino na metodologia



2. PERSONALIZAÇÃO POR NÍVEL DE EXPERIÊNCIA
Se Instrutor INICIANTE:

- Forneça sugestões pedagógicas em comentários para o instrutor
- Inclua dicas de apresentação e engajamento
- Estruture conteúdo de forma muito didática com progressão gradual
- Adicione seções de "Por que isso é importante"
- Inclua exemplos simples e relacionáveis

Se Instrutor INTERMEDIÁRIO:

- Balance teoria e prática conforme solicitado
- Inclua metodologias variadas (estudos de caso, exercícios, discussões)
- Integre ferramentas e recursos mencionados pelo instrutor
- Adicione seções de aprofundamento opcional
- Conecte com experiências anteriores do instrutor

Se Instrutor AVANÇADO:

- Implemente metodologias pedagógicas sofisticadas
- Crie trilhas de aprendizagem múltiplas
- Inclua conteúdo para formação de outros instrutores
- Adicione elementos de pesquisa e inovação
- Desenvolva projetos complexos e desafiadores

3. INTEGRAÇÃO DE CONTEÚDO DOS MATERIAIS
Se materiais foram fornecidos:

- Extraia conceitos-chave e organize didaticamente
- Mantenha a voz autoral do instrutor
- Crie conexões entre o material existente e novos conteúdos
- Sugira melhorias na estrutura pedagógica
- Transforme informações densas em conteúdo digestível

4. FORMATOS E METODOLOGIA
Baseado nas preferências indicadas (${preferredFormats?.join(', ')}):

- Vídeos: Roteiros detalhados com timing e recursos visuais
- Texto/PDF: Conteúdo bem estruturado com recursos visuais
- Quiz/Avaliações: Questões variadas alinhadas aos objetivos
- Exercícios Práticos: Atividades hands-on relevantes
- Projetos: Projetos completos com critérios de avaliação
- Estudos de Caso: Cases reais da área do instrutor

5. AVALIAÇÕES E PROJETOS
Se incluir avaliações = true:

Crie quizzes variados: múltipla escolha, verdadeiro/falso, dissertativas
Alinhe com objetivos: cada pergunta deve testar um objetivo específico
Inclua feedback personalizado para cada resposta
Varie níveis de dificuldade (conhecimento, compreensão, aplicação, análise)

Se incluir projetos = true:

Desenvolva projetos progressivos que construam competências
Crie critérios de avaliação claros (rubricas)
Inclua templates e exemplos
Conecte com situações reais da área do instrutor

6. CONSIDERAÇÕES ESPECIAIS
Público-Alvo:

- Adapte linguagem ao nível do público (${targetAudience})
- Inclua exemplos relevantes ao contexto dos alunos
- Considere conhecimentos prévios esperados

Duração (${duration}):

- Distribua conteúdo apropriadamente no tempo disponível
- Inclua pausas e momentos de consolidação
- Balance densidade informacional com assimilação

Motivação do Instrutor (${instructorMotivation}):

- Reflita a motivação na estrutura e abordagem do curso
- Alinhe metodologia com os objetivos pessoais do instrutor
- Inclua elementos que satisfaçam as expectativas declaradas
`,
				},
				{
					type: 'text',
					text: `LEMBRE-SE: O curso deve soar como se fosse criado genuinamente pelo instrutor, refletindo sua personalidade, experiência e estilo único de ensino.
Use todos os dados fornecidos para criar uma experiência verdadeiramente personalizada e autêntica.`,
				},
			],
		},
	];
}
