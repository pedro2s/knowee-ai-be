import { v4 as uuidv4 } from 'uuid';
import {
	CreateHistorySummaryInput,
	HistorySummaryProps,
} from './history-summary.type';

export class HistorySummary {
	private constructor(private readonly props: HistorySummaryProps) {}

	static create(input: CreateHistorySummaryInput): HistorySummary {
		return new HistorySummary({
			userId: input.userId,
			courseId: input.courseId,
			summary: input.summary,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}

	static restore(props: HistorySummaryProps): HistorySummary {
		return new HistorySummary(props);
	}

	get userId(): string {
		return this.props.userId;
	}

	get courseId(): string {
		return this.props.courseId;
	}

	get summary(): string {
		return this.props.summary;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	public toPrimitives() {
		return {
			...this.props,
		};
	}
}
