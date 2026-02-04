export const MEDIA_SERVICE = 'MediaService';

export interface MediaPort {
	getAudioDuration(file: string): Promise<number>;
	mergeAudios(files: string[], output: string): Promise<void>;
	addBackgroundMusic(
		voice: string,
		music: string,
		output: string,
		vol?: number
	): Promise<void>;
	cutMedia(
		input: string,
		start: string,
		duration: string,
		output: string
	): Promise<void>;
	imageToVideo(image: string, audio: string, output: string): Promise<void>;
	concatVideos(listFile: string, output: string): Promise<void>;
	syncVideoWithAudio(
		video: string,
		audio: string,
		output: string
	): Promise<void>;
	/**
	 * Gera um vídeo com efeito "Ken Burns" (zoom lento) e texto sobreposto.
	 * Padrão visual estilo NotebookLM/Documentário.
	 */
	createDynamicScene(params: {
		imagePath: string;
		audioPath: string;
		outputPath: string;
		textOverlay?: string;
		fontPath?: string; // Caminho para um arquivo .ttf (Opcional, mas recomendado)
	}): Promise<void>;
}
