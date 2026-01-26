export interface ScriptSection {
	id: string;
	content: string;
	isRecorded: boolean;
	status: string;
	notes: string;
	time: number;
	timerActive: boolean;
	videoUrl?: string;
	videoPath?: string;
	videoDuration?: number;
	videoStatus?: 'pending' | 'generating' | 'ready' | 'error';
}

export interface GenerateLessonScriptInput {
	title: string;
	description: string;
}

export interface GeneratedLessonScript {
	scriptSections: Array<ScriptSection>;
}
