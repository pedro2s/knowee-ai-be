import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import * as ffprobe from 'ffprobe-static';
import { MediaPort } from '../../application/ports/media.port';
import path from 'path';
import fs from 'fs/promises';

@Injectable()
export class MediaService implements MediaPort {
	private readonly logger = new Logger(MediaService.name);

	private runFFmpeg(args: string[]): Promise<void> {
		return new Promise((resolve, reject) => {
			const ffmpeg = spawn(ffmpegPath!, args);

			ffmpeg.stderr.on('data', (data) => {
				this.logger.verbose(`FFmpeg: ${data}`);
			});
			ffmpeg.on('error', reject);
			ffmpeg.on('close', (code) => {
				if (code === 0) {
					resolve();
				} else {
					reject(new Error(`FFmpeg process exited with code ${code}`));
				}
			});
		});
	}

	private runFFprobe(args: string[]): Promise<string> {
		return new Promise((resolve, reject) => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			const ffprobeProcess = spawn(ffprobe.path as string, args);
			let output = '';

			ffprobeProcess.stdout.on('data', (data: Buffer) => {
				output += data.toString();
			});

			ffprobeProcess.stderr.on('data', (data) => {
				this.logger.verbose(`FFprobe: ${data}`);
			});
			ffprobeProcess.on('error', reject);
			ffprobeProcess.on('close', (code) => {
				if (code === 0) {
					resolve(output);
				} else {
					reject(new Error(`FFprobe process exited with code ${code}`));
				}
			});
		});
	}

	async getAudioDuration(file: string): Promise<number> {
		const output = await this.runFFprobe([
			'-v',
			'error',
			'-show_entries',
			'format=duration',
			'-of',
			'default=noprint_wrappers=1:nokey=1',
			file,
		]);

		return parseFloat(output.trim());
	}

	mergeAudios(files: string[], output: string) {
		return this.runFFmpeg([
			'-y',
			...files.flatMap((f) => ['-i', f]),
			'-filter_complex',
			`concat=n=${files.length}:v=0:a=1`,
			output,
		]);
	}

	addBackgroundMusic(voice: string, music: string, output: string, vol = 0.15) {
		return this.runFFmpeg([
			'-y',
			'-i',
			voice,
			'-i',
			music,
			'-filter_complex',
			`[1:a]volume=${vol}[bg];[0:a][bg]amix=inputs=2`,
			output,
		]);
	}

	cutMedia(input: string, start: string, duration: string, output: string) {
		return this.runFFmpeg([
			'-y',
			'-i',
			input,
			'-ss',
			start,
			'-t',
			duration,
			output,
		]);
	}

	imageToVideo(image: string, audio: string, output: string) {
		// increase: garante que cubra toda a área
		// crop: corta o excesso
		// decrease:
		// pad:
		return this.runFFmpeg([
			'-y',
			'-loop',
			'1',
			'-i',
			image,
			'-i',
			audio,
			'-vf',
			'scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1',
			'-c:v',
			'libx264',
			'-c:a',
			'aac',
			'-shortest',
			'-pix_fmt',
			'yuv420p',
			output,
		]);
	}

	concatVideos(listFile: string, output: string) {
		return this.runFFmpeg([
			'-y',
			'-f',
			'concat',
			'-safe',
			'0',
			'-i',
			listFile,
			'-c',
			'copy',
			output,
		]);
	}

	syncVideoWithAudio(video: string, audio: string, output: string) {
		return this.runFFmpeg([
			'-y',
			'-i',
			video,
			'-i',
			audio,
			'-map',
			'0:v',
			'-map',
			'1:a',
			'-c:v',
			'copy',
			'-shortest',
			output,
		]);
	}

	async createDynamicScene(params: {
		imagePath: string;
		audioPath: string;
		outputPath: string;
		textOverlay?: string;
		quality?: 'fast' | 'balanced' | 'high';
	}): Promise<void> {
		// 1. Precisamos da duração para calcular o zoom suave
		const durationInSeconds = await this.getAudioDuration(params.audioPath);

		// FPS do vídeo de saída
		const fps = 30;

		// Calculamos o total de frames + uma margem de segurança para o zoom não acabar antes do áudio
		const totalFrames = Math.ceil((durationInSeconds + 2) * fps);

		// Caminho para o arquivo de texto temporário
		let assFilePath: string | null = null;
		let subtitleFilter = '';

		if (params.textOverlay) {
			// ESTRATÉGIA SEGURA: Escrever o texto em um arquivo temporário
			// Isso evita qualquer erro de "escaping" na linha de comando do FFmpeg
			const tempDir = path.dirname(params.outputPath);
			const fileName = `subs_${Date.now()}.ass`; // Melhor usar extensão .ass para clareza
			assFilePath = path.join(tempDir, fileName);

			// Nota: O ASS lida automaticamente com quebras de linha se o texto for longo
			const assContent = this.createAssContent(
				params.textOverlay,
				durationInSeconds + 2
			);
			// Escreve o conteúdo ASS no arquivo temporário
			await fs.writeFile(assFilePath, assContent, 'utf-8');

			// Configura o filtro ASS
			// Precisamos escapar o caminho do arquivo apenas para o FFmpeg (barras e dois pontos)
			// No Linux, o path geralmente é seguro, mas vamos garantir
			const safeAssPath = assFilePath.replace(/\\/g, '/').replace(/:/g, '\\:');
			subtitleFilter = `ass='${safeAssPath}'`;
		}

		// 3. ZOOM SUAVE SEM JITTER - Otimizado para Render

		// Estratégia: Usar resolução intermediária (2K) para balancear qualidade e performance
		// Escalar para 2560x1440 reduz processamento em ~50% vs 4K mantendo qualidade
		const preProcess = `scale=2560:1440:force_original_aspect_ratio=increase,crop=2560:1440,setsar=1`;

		// NOVO: Interpolação cúbica suave (cubic easing out) para eliminar jitter
		// Fórmula: easeOutCubic(t) = 1 - (1-t)^3 onde t = on/totalFrames
		// Resultado: zoom começa rápido e desacelera suavemente no final
		// Fator de zoom: 1.0 até 1.15 (movimento visível mas não exagerado)
		const t = `(on/${totalFrames})`;
		const easeOutCubic = `(1-(1-${t})*(1-${t})*(1-${t}))`;
		const zoomExpr = `'1.0+0.15*${easeOutCubic}'`;

		// Centralização com pan suave (mesmo easing aplicado ao deslocamento)
		const panEasing = easeOutCubic;
		const centerX = `'(iw-ow/(1.0+0.15*${panEasing}))/2'`;
		const centerY = `'(ih-oh/(1.0+0.15*${panEasing}))/2'`;

		const zoomFilter = `zoompan=z=${zoomExpr}:x=${centerX}:y=${centerY}:d=${totalFrames}:s=2560x1440:fps=${fps}`;

		// Downscale final com filtro bicúbico (mais rápido que Lanczos, qualidade similar)
		const postProcess = `scale=1920:1080:flags=bicubic`;

		const filterComplex = `[0:v]${preProcess},${zoomFilter},${postProcess},${subtitleFilter}[v_out]`;

		// 4. Executa o FFmpeg
		const ffmpegArgs = [
			'-y',
			'-loop',
			'1', // Loop na imagem
			'-i',
			params.imagePath, // Input 0
			'-i',
			params.audioPath, // Input 1
			'-filter_complex',
			filterComplex,
			'-map',
			'[v_out]', // Usa o vídeo processado pelo filtro
			'-map',
			'1:a', // Usa o áudio original
			'-c:v',
			'libx264', // Codec de vídeo
			// Otimizações para Render:
			'-preset',
			'faster', // Mais rápido que 'medium' (~40% mais rápido), qualidade ainda ótima
			'-crf',
			'22', // Qualidade balanceada (22 é praticamente indistinguível de 20 ao olho humano)
			'-x264-params',
			'aq-mode=3:aq-strength=0.8', // Adaptive quantization reduz artifacts
			'-c:a',
			'aac',
			'-b:a',
			'128k', // Reduzido de 192k (economiza 33% de tamanho)
			'-pix_fmt',
			'yuv420p',
			// NOVO: Otimizações para plataforma Render
			'-movflags',
			'+faststart', // Permite que o vídeo inicie sem baixar tudo
			'-threads',
			'4', // Limita threads para não sobrecarregar Render
			'-t',
			`${Math.ceil(durationInSeconds + 0.5)}`,
			'-shortest',
			params.outputPath,
		];

		try {
			await this.runFFmpeg(ffmpegArgs);
		} finally {
			// 5. Limpeza do arquivo temporário
			if (assFilePath) {
				try {
					fs.rm(assFilePath).catch((err) => {
						this.logger.warn(`Falha ao remover arquivo temporário: ${err}`);
					});
				} catch (error) {
					this.logger.warn(`Falha ao remover arquivo temporário: ${error}`);
				}
			}
		}
	}

	/**
	 * Cria o conteúdo do arquivo de legenda .ass (Advanced Substation Alpha)
	 * Isso permite definir caixa de fundo, fonte, posição e cores sem o caos da linha de comando.
	 */
	private createAssContent(text: string, duration: number): string {
		// Se tiver fonte personalizada, tenta usar o nome da família ou o arquivo
		// No ASS, geralmente se usa o nome da fonte instalada, mas o ffmpeg permite carregar arquivos via attachment em casos complexos.
		// Para simplificar, vamos definir uma fonte genérica Sans, mas o estilo visual será controlado aqui.

		// Convertemos duração para formato H:MM:SS.cs
		const hours = Math.floor(duration / 3600);
		const minutes = Math.floor((duration % 3600) / 60);
		const seconds = Math.floor(duration % 60);
		const centis = Math.floor((duration % 1) * 100);
		const formatTime = (v: number) => v.toString().padStart(2, '0');
		const endTime = `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}.${formatTime(centis)}`;

		// BackColour = &HAA000000 (AA = Alpha/Transparência, formato BGR)
		// &H66000000 -> 0x66 (aprox 40% transparente) preto

		return `[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 1

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,48,&H00FFFFFF,&H000000FF,&H00000000,&H60000000,0,0,0,0,100,100,0,0,3,0,0,2,10,10,80,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,${endTime},Default,,0,0,0,,${text}
`;
	}
}
