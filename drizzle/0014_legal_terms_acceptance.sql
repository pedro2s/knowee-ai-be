CREATE TABLE "legal_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_type" text NOT NULL,
	"version" text NOT NULL,
	"title" text NOT NULL,
	"content_markdown" text NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "legal_acceptances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"document_type" text NOT NULL,
	"document_version" text NOT NULL,
	"source" text NOT NULL,
	"user_agent" text,
	"ip_address" text,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "legal_acceptances" ADD CONSTRAINT "legal_acceptances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_acceptances" ADD CONSTRAINT "legal_acceptances_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."legal_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "legal_documents_active_type_idx" ON "legal_documents" USING btree ("document_type") WHERE "legal_documents"."is_active" = true;--> statement-breakpoint
CREATE INDEX "legal_acceptances_user_document_idx" ON "legal_acceptances" USING btree ("user_id","document_type","accepted_at");--> statement-breakpoint
INSERT INTO "legal_documents" (
	"document_type",
	"version",
	"title",
	"content_markdown",
	"is_active",
	"published_at"
) VALUES (
	'terms_of_use',
	'v1',
	'Termo de Uso da Knowee',
	$$# Termo de Uso da Knowee

Versão: v1
Data de publicação: 2026-03-14

## 1. Objeto

Este Termo de Uso regula o acesso e a utilização da plataforma Knowee, operada por Knowee Tecnologia, para criação, estruturação, edição, enriquecimento e exportação de conteúdos educacionais com apoio de inteligência artificial.

## 2. Natureza da plataforma e aviso sobre IA

A Knowee disponibiliza ferramentas técnicas de apoio à criação de conteúdo com uso de modelos de inteligência artificial e outros serviços automatizados.

Todo conteúdo gerado na plataforma é conteúdo produzido com apoio de inteligência artificial e pode conter erros, omissões, vieses, desatualização, imprecisões factuais, inadequações técnicas, jurídicas, pedagógicas ou regulatórias.

A Knowee Tecnologia não garante que o conteúdo gerado seja verdadeiro, completo, adequado para uma finalidade específica, juridicamente válido, pedagogicamente correto, isento de vieses ou apto para publicação sem revisão humana.

## 3. Responsabilidade do usuário sobre o conteúdo

Ao utilizar a plataforma, o usuário reconhece e concorda que:

- é o único responsável pela revisão humana, validação, edição final, aprovação e publicação de qualquer conteúdo gerado ou transformado pela plataforma;
- deve verificar a veracidade, atualidade, coerência, legalidade e adequação técnica e pedagógica do material antes de qualquer uso externo;
- assume integral responsabilidade pelo uso, publicação, compartilhamento, comercialização, distribuição, exportação ou disponibilização do conteúdo a terceiros;
- não deve confiar exclusivamente na saída automatizada da IA para fins que demandem alta precisão, avaliação especializada ou obrigações legais.

A Knowee Tecnologia não se responsabiliza pela produção editorial do conteúdo nem por danos decorrentes da confiança, uso, publicação ou exploração de conteúdo gerado na plataforma sem a devida revisão humana pelo usuário.

## 4. Conteúdos enviados pelo usuário

O usuário é responsável por todos os prompts, textos, documentos, imagens, áudios, vídeos, bases de dados e demais materiais inseridos na plataforma, declarando que possui os direitos, autorizações e bases legais necessárias para seu uso.

O usuário também é responsável por garantir que não inserirá conteúdos ilícitos, ofensivos, sigilosos sem autorização ou dados pessoais em desconformidade com a legislação aplicável.

## 5. Tratamento de dados pessoais e LGPD

No tratamento de dados relacionados à conta, autenticação, cobrança, segurança, suporte, prevenção à fraude, logs e operação da plataforma, a Knowee Tecnologia atua como controladora, nos termos da Lei Geral de Proteção de Dados Pessoais.

No tratamento de dados pessoais que o próprio usuário inserir em prompts, documentos, aulas, roteiros, arquivos e demais materiais processados para execução das funcionalidades da plataforma, a Knowee Tecnologia atua, em regra, como operadora ou suboperadora técnica, limitada ao tratamento necessário para a prestação do serviço, permanecendo o usuário responsável pela base legal, adequação, minimização e legitimidade do dado inserido.

A plataforma pode utilizar provedores terceiros de infraestrutura e inteligência artificial para viabilizar suas funcionalidades, inclusive para processamento automatizado dos dados estritamente necessário à execução do serviço.

A Knowee adota medidas de segurança compatíveis com a natureza do serviço e do tratamento realizado, sem prejuízo da obrigação do usuário de utilizar a plataforma de maneira diligente e de evitar o envio desnecessário de dados pessoais sensíveis ou excessivos.

## 6. Transparência e automação

O usuário declara estar ciente de que a plataforma utiliza processamento automatizado e modelos de inteligência artificial como ferramenta de apoio, sem revisão humana individual obrigatória por parte da Knowee sobre cada saída gerada.

## 7. Usos proibidos

É vedado utilizar a plataforma para:

- práticas ilícitas ou violação de direitos de terceiros;
- envio ou tratamento indevido de dados pessoais sem base legal;
- violação de direitos autorais, segredo de negócio ou confidencialidade;
- geração de conteúdos fraudulentos, enganosos, discriminatórios, difamatórios ou proibidos por lei;
- tentativas de engenharia reversa, abuso da infraestrutura ou contorno indevido de limites técnicos e contratuais.

## 8. Limitação de garantias e de responsabilidade

A plataforma é fornecida no estado em que se encontra, com recursos automatizados sujeitos a variação técnica e estatística.

Na máxima extensão permitida pela legislação aplicável, a Knowee Tecnologia não responde por resultados editoriais, mercadológicos, pedagógicos, regulatórios ou comerciais esperados pelo usuário, nem pela veracidade intrínseca do conteúdo gerado, sem prejuízo das responsabilidades legais que não possam ser afastadas.

Nada neste Termo afasta responsabilidades legais obrigatórias da Knowee quando expressamente previstas na legislação aplicável.

## 9. Atualizações, versões e reaceite

Este Termo poderá ser atualizado a qualquer momento para refletir alterações legais, regulatórias, técnicas ou de produto.

A Knowee poderá exigir novo aceite sempre que houver nova versão vigente do documento.

O aceite eletronicamente registrado, com data, hora e versão do documento, constitui manifestação válida, livre e informada do usuário.

## 10. Contato

Dúvidas, solicitações ou comunicações relacionadas a este Termo e ao tratamento de dados pessoais podem ser encaminhadas para: contato@knowee.com.
$$,
	true,
	now()
);--> statement-breakpoint
