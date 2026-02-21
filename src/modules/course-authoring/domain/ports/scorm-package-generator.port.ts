import type { ScormCourseExportInput } from '../entities/scorm-export.types';

export const SCORM_PACKAGE_GENERATOR = Symbol('SCORM_PACKAGE_GENERATOR');

export interface ScormPackageGeneratorResult {
	zipPath: string;
	fileName: string;
	cleanup: () => Promise<void>;
}

export interface ScormPackageGeneratorPort {
	generate(input: ScormCourseExportInput): Promise<ScormPackageGeneratorResult>;
}
