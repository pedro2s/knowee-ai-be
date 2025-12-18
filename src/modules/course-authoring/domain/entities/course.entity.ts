export class Course {
	constructor(
		public id: string,
		public title: string,
		public description: string | null,
		public category: string | null,
		public level: string | null,
		public duration: string | null,
		public targetAudience: string | null,
		public userId: string,
		public createdAt: Date,
		public updatedAt: Date,
	) {}
}

export interface CreateCouseInput {
	title: string;
	description?: string;
	category?: string;
	level?: string;
	duration?: string;
	targetAudience?: string;
	userId: string;
	model?: string; // Added model property
	provider?: string;
}

export interface GeneratedCourse {
	course: {
		title: string;
		description: string;
		category: string;
		level: string;
		duration: string;
		targetAudience: string;
	};
	lessons: Array<{
		title: string;
		content: string;
		order: number;
	}>;
}
