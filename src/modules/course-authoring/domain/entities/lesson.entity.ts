export class Lesson {
	constructor(
		public id: string,
		public moduleId: string,
		public title: string,
		public description: string | null,
		public lessonType: string | null,
		public content: any,
		public assets: any,
		public orderIndex: number,
		public duration: number | null,
		public createdAt: Date,
		public updatedAt: Date,
	) {}
}
