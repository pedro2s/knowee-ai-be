import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';
import { InputFile } from 'src/modules/course-authoring/domain/entities/course.types';

@Injectable()
export class FileProcessingService {
	private readonly logger = new Logger(FileProcessingService.name);

	async extractTextFromFiles(files: InputFile[]): Promise<string> {
		if (!files || files.length === 0) {
			return '';
		}

		this.logger.log(`Extraindo texto de ${files.length} arquivo(s)...`);
		const texts: string[] = [];

		for (const file of files) {
			const ext = path.extname(file.originalname).toLowerCase();
			const buffer = file.buffer;

			try {
				if (ext === '.pdf') {
					const parse = new PDFParse({ data: buffer });
					const data = await parse.getText();
					texts.push(data.text);
				} else if (ext === '.docx') {
					const { value } = await mammoth.extractRawText({ buffer });
					texts.push(value);
				} else if (ext === '.txt') {
					texts.push(buffer.toString('utf-8'));
				} else {
					this.logger.warn(
						`Formato de arquivo não suportado: ${ext}. Arquivo ignorado.`, 
					);
				}
			} catch (error) {
				this.logger.error(
					`Erro ao processar o arquivo ${file.originalname}:`,
					error,
				);
			}
		}

		this.logger.log('Extração de texto concluída.');
		return texts.join('\n\n');
	}
}
