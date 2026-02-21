import { Injectable } from '@nestjs/common';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import type {
	ScormPackageGeneratorPort,
	ScormPackageGeneratorResult,
} from '../../../domain/ports/scorm-package-generator.port';
import type {
	ScormCourseExportInput,
	ScormExportLesson,
} from '../../../domain/entities/scorm-export.types';
import { ScormManifestBuilder } from './scorm-manifest.builder';

const execFileAsync = promisify(execFile);

@Injectable()
export class ScormPackageGeneratorAdapter implements ScormPackageGeneratorPort {
	constructor(private readonly manifestBuilder: ScormManifestBuilder) {}

	async generate(
		input: ScormCourseExportInput
	): Promise<ScormPackageGeneratorResult> {
		const slug = this.slugify(input.title) || 'curso';
		const random = crypto.randomUUID();
		const rootTempDir = path.join(
			os.tmpdir(),
			'knowee-scorm',
			`${input.id}-${random}`
		);
		const packageDir = path.join(rootTempDir, 'package');
		const zipPath = path.join(rootTempDir, `${slug}.zip`);

		await fs.mkdir(packageDir, { recursive: true });

		try {
			await this.writeManifest(input, packageDir);
			await this.copyXsdFiles(packageDir);
			await this.writeLessons(input, packageDir);
			await this.zipDirectory(packageDir, zipPath);

			return {
				zipPath,
				fileName: `${slug}.zip`,
				cleanup: async () => {
					await fs.rm(rootTempDir, { recursive: true, force: true });
				},
			};
		} catch (error) {
			await fs.rm(rootTempDir, { recursive: true, force: true });
			throw error;
		}
	}

	private async writeManifest(
		input: ScormCourseExportInput,
		packageDir: string
	): Promise<void> {
		const manifestXML = this.manifestBuilder.build(input);
		await fs.writeFile(
			path.join(packageDir, 'imsmanifest.xml'),
			manifestXML,
			'utf-8'
		);
	}

	private async copyXsdFiles(packageDir: string): Promise<void> {
		const xsdSourceDir = path.join(__dirname, 'templates', 'xsd');
		const xsdFiles = await fs.readdir(xsdSourceDir);

		for (const file of xsdFiles) {
			await fs.copyFile(
				path.join(xsdSourceDir, file),
				path.join(packageDir, file)
			);
		}
	}

	private async writeLessons(
		input: ScormCourseExportInput,
		packageDir: string
	): Promise<void> {
		for (let i = 0; i < input.modules.length; i++) {
			for (let j = 0; j < input.modules[i].lessons.length; j++) {
				const lesson = input.modules[i].lessons[j];
				const scoDir = path.join(packageDir, `sco${i + 1}_${j + 1}`);
				await fs.mkdir(scoDir, { recursive: true });
				await this.writeLessonContent(scoDir, lesson);
			}
		}
	}

	private async writeLessonContent(
		scoDir: string,
		lesson: ScormExportLesson
	): Promise<void> {
		const templatesBaseDir = path.join(__dirname, 'templates');

		if (
			(lesson.lessonType === 'video' || lesson.lessonType === 'audio') &&
			!lesson.shouldUseVideoFallback
		) {
			await fs.copyFile(
				path.join(templatesBaseDir, 'player', 'player.html'),
				path.join(scoDir, 'player.html')
			);
			await fs.copyFile(
				path.join(templatesBaseDir, 'player', 'scorm_api_wrapper.js'),
				path.join(scoDir, 'scorm_api_wrapper.js')
			);
			return;
		}

		if (lesson.lessonType === 'quiz') {
			const quizQuestions = Array.isArray(lesson.content.quizQuestions)
				? lesson.content.quizQuestions
				: [];
			const html = await this.renderTemplate(
				path.join(templatesBaseDir, 'quiz', 'quiz.ejs'),
				{ questions: quizQuestions }
			);
			await fs.writeFile(path.join(scoDir, 'quiz.html'), html, 'utf-8');
			await fs.copyFile(
				path.join(templatesBaseDir, 'quiz', 'quiz.js'),
				path.join(scoDir, 'quiz.js')
			);
			await fs.copyFile(
				path.join(templatesBaseDir, 'quiz', 'scormdriver.js'),
				path.join(scoDir, 'scormdriver.js')
			);
			return;
		}

		if (lesson.lessonType === 'article') {
			const html = await this.renderTemplate(
				path.join(templatesBaseDir, 'article', 'article.ejs'),
				{
					title: lesson.title,
					description: lesson.description || '',
					articleContent: lesson.content.articleContent || '',
				}
			);
			await fs.writeFile(path.join(scoDir, 'index.html'), html, 'utf-8');
			await fs.copyFile(
				path.join(templatesBaseDir, 'player', 'scorm_api_wrapper.js'),
				path.join(scoDir, 'scorm_api_wrapper.js')
			);
			return;
		}

		if (lesson.lessonType === 'pdf') {
			const html = await this.renderTemplate(
				path.join(templatesBaseDir, 'pdf', 'pdf.ejs'),
				{
					title: lesson.title,
					description: lesson.description || '',
					pdfUrl: lesson.content.pdfUrl || '',
				}
			);
			await fs.writeFile(path.join(scoDir, 'index.html'), html, 'utf-8');
			await fs.copyFile(
				path.join(templatesBaseDir, 'player', 'scorm_api_wrapper.js'),
				path.join(scoDir, 'scorm_api_wrapper.js')
			);
			return;
		}

		if (lesson.lessonType === 'external') {
			const html = await this.renderTemplate(
				path.join(templatesBaseDir, 'external', 'external.ejs'),
				{
					title: lesson.title,
					description: lesson.description || '',
					content: lesson.content,
				}
			);
			await fs.writeFile(path.join(scoDir, 'index.html'), html, 'utf-8');
			await fs.copyFile(
				path.join(templatesBaseDir, 'player', 'scorm_api_wrapper.js'),
				path.join(scoDir, 'scorm_api_wrapper.js')
			);
			return;
		}

		const fallbackHtml = await this.renderTemplate(
			path.join(templatesBaseDir, 'fallback', 'video-unavailable.ejs'),
			{
				title: lesson.title,
				description: lesson.description || '',
			}
		);
		await fs.writeFile(path.join(scoDir, 'index.html'), fallbackHtml, 'utf-8');
		await fs.copyFile(
			path.join(templatesBaseDir, 'player', 'scorm_api_wrapper.js'),
			path.join(scoDir, 'scorm_api_wrapper.js')
		);
	}

	private async zipDirectory(
		sourceDir: string,
		outputZipPath: string
	): Promise<void> {
		await execFileAsync('zip', ['-r', '-q', outputZipPath, '.'], {
			cwd: sourceDir,
		});
	}

	private async renderTemplate(
		templatePath: string,
		variables: Record<string, unknown>
	): Promise<string> {
		const template = await fs.readFile(templatePath, 'utf-8');
		return template.replace(
			/<%-\s*([^%]+?)\s*%>/g,
			(_match: string, expression: string) => {
				const value = this.resolveExpression(expression.trim(), variables);
				if (typeof value === 'string') return value;
				if (typeof value === 'number' || typeof value === 'boolean') {
					return value.toString();
				}
				return '';
			}
		);
	}

	private resolveExpression(
		expression: string,
		variables: Record<string, unknown>
	): unknown {
		if (expression === 'JSON.stringify(questions)') {
			return JSON.stringify(variables.questions ?? []);
		}

		const keys = expression.split('.');
		let current: unknown = variables;
		for (const key of keys) {
			if (!current || typeof current !== 'object') {
				return '';
			}
			current = (current as Record<string, unknown>)[key];
		}
		return current ?? '';
	}

	private slugify(value: string): string {
		return value
			.toLowerCase()
			.trim()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}
}
