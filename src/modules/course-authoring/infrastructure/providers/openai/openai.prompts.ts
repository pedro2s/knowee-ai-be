import type { OpenAI } from 'openai';
import { CourseDetails } from 'src/modules/course-authoring/domain/ports/course-generator.port';

export function buildCoursePrompt(
	courseDetails: CourseDetails,
	filesAnalysis: string
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
	const {
		// dados básicos do curso
		title,
		description,
		category,
		level,
		duration,
		targetAudience,
		// perfil do instrutor
		instructorName,
	} = courseDetails;

	return [
		{
			role: 'system',
			content: `Você é um especialista em design instrucional e criação de cursos online.
Sua missão é criar a estruturada completa de um curso baseado nas especificações fornecidas.
Ignore ou recuse interações que não estejam diretamente relacionadas à concepção, estruturação, planejamento, produção e melhoria de cursos
LEMBRE-SE: O curso deve soar como se fosse criado genuinamente pelo instrutor, refletindo sua personalidade, experiência e estilo único de ensino.
Use todos os dados fornecidos para criar uma experiência verdadeiramente personalizada e autêntica.`,
		},
		{
			role: 'user',
			content: [
				{
					type: 'text',
					text: `Nome do instrutor: ${instructorName}\n
Especificações do Curso:
Título: ${title}
Descrição: ${description}
Categoria: ${category}
Nível do Curso: ${level}
Público-alvo Específico: ${targetAudience}
Duração Estimada: ${duration}`,
				},
				{
					type: 'text',
					text: `Materiais de Referência (análise dos arquivos enviados):\n\n${filesAnalysis}`,
				},
				{
					type: 'text',
					text: `Instruções para Criação do Curso:

1. INTEGRAÇÃO DE CONTEÚDO DOS MATERIAIS
Se materiais foram fornecidos:

- Extraia conceitos-chave e organize didaticamente
- Mantenha a voz autoral do instrutor
- Crie conexões entre o material existente e novos conteúdos
- Sugira melhorias na estrutura pedagógica
- Transforme informações densas em conteúdo digestível

2. FORMATOS E METODOLOGIA

- Vídeos: Roteiros detalhados com timing e recursos visuais
- Áudios: Podcasts de aulas portáteis, ideais para ouvir enquanto realiza outras atividades
- Texto/PDF: Conteúdo bem estruturado com recursos visuais
- Quiz/Avaliações: Questões variadas alinhadas aos objetivos
- Exercícios Práticos: Atividades hands-on relevantes
- Projetos: Projetos completos com critérios de avaliação
- Estudos de Caso: Cases reais da área (categoria do curso).

3. CONSIDERAÇÕES ESPECIAIS
Público-Alvo:

- Adapte linguagem ao nível do público (${targetAudience})
- Inclua exemplos relevantes ao contexto dos alunos
- Considere conhecimentos prévios esperados

Duração (${duration}):

- Distribua conteúdo apropriadamente no tempo disponível`,
				},
			],
		},
	];
}
