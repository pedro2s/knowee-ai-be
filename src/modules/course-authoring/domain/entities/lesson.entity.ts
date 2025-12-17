export class Lesson {
  constructor(
    public id: string,
    public courseId: string,
    public title: string,
    public content: string,
    public order: number,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
