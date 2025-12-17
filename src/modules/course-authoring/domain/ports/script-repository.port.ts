import { ScriptSection } from '../entities/script-section.entity';

export interface ScriptRepositoryPort {
	getScriptSections(lessonId: string): Promise<ScriptSection[]>;
	// Add other script-related methods as needed
}
