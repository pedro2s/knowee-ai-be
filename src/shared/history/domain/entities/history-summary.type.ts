export interface HistorySummaryProps {
	userId: string;
	courseId: string;
	summary: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateHistorySummaryInput {
	userId: string;
	courseId: string;
	summary: string;
}
