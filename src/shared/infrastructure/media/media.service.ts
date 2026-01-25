import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import * as ffprobe from 'ffprobe-static';
import { MediaPort } from '../../application/ports/media.port';

@Injectable()
export class MediaService implements MediaPort {
	private readonly logger = new Logger(MediaService.name);

	private runFFmpeg(args: string[]): Promise<void> {
		return new Promise((resolve, reject) => {
			const ffmpeg = spawn(ffmpegPath!, args);

			ffmpeg.stderr.on('data', (data) => {
				this.logger.verbose(`FFmpeg Error: ${data}`);
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
				this.logger.verbose(`FFprobe Error: ${data}`);
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
		return this.runFFmpeg([
			'-y',
			'-loop',
			'1',
			'-i',
			image,
			'-i',
			audio,
			'-vf',
			'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1',
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
}
