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
	 * Padrão visual estilo NotebookLM/Documentário com zoom suave sem jitter.
	 *
	 * @param params.imagePath - Caminho da imagem
	 * @param params.audioPath - Caminho do áudio (determina duração do vídeo)
	 * @param params.outputPath - Caminho de saída do vídeo MP4
	 * @param params.textOverlay - (Opcional) Texto para sobrepor no vídeo
	 * @param params.fontPath - (Opcional) Caminho para fonte TTF personalizada
	 * @param params.quality - (Opcional) 'fast' para Render, 'balanced' (padrão), ou 'high' para qualidade máxima
	 *
	 * Melhorias de performance:
	 * - Interpolação cúbica para eliminar jitter do zoom
	 * - Resolução intermediária (2K) para balancear qualidade/performance
	 * - Flags otimizadas para ambientes com recursos limitados (Render)
	 */
	createDynamicScene(params: {
		imagePath: string;
		audioPath: string;
		outputPath: string;
		textOverlay?: string;
		quality?: 'fast' | 'balanced' | 'high';
	}): Promise<void>;
}
