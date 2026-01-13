import { ResponseFormatJSONSchema } from 'openai/resources';

export const scriptSectionsStructureAsObject = {
	type: 'object',
	properties: {
		scriptSections: {
			type: 'array',
			description: 'A list of script sections.',
			items: {
				type: 'object',
				properties: {
					id: {
						type: 'string',
						description: 'Unique identifier for the section.',
					},
					content: {
						type: 'string',
						description: 'The text of the script section in markdown format.',
					},
					isRecord: {
						type: 'boolean',
						description: 'Indicates if this section is for recording.',
						default: false,
					},
					status: {
						type: 'string',
						description: 'The status of the section.',
						enum: ['default'],
					},
					notes: {
						type: 'string',
						description: 'Additional notes for the section.',
					},
					time: {
						type: 'integer',
						description: 'Estimated time in seconds for this section.',
						enum: [0],
					},
					timerActive: {
						type: 'boolean',
						description: 'Indicates if the timer is active for this section.',
						enum: [false],
					},
				},
				required: [
					'id',
					'content',
					'isRecord',
					'status',
					'notes',
					'time',
					'timerActive',
				],
				additionalProperties: false,
			},
		},
	},
	required: ['scriptSections'],
	additionalProperties: false,
};

export const scriptSectionsStructure: ResponseFormatJSONSchema = {
	type: 'json_schema',
	json_schema: {
		name: 'script_sections_structure',
		strict: true,
		schema: scriptSectionsStructureAsObject,
	},
};
