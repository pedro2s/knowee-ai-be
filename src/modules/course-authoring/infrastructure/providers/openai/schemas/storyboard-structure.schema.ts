import { ResponseFormatJSONSchema } from 'openai/resources';

export const storyboardStructureSchemaAsObject = {
	type: 'object',
	properties: {
		storyboard: {
			type: 'array',
			description: 'A list of storyboard scenes.',
			items: {
				type: 'object',
				properties: {
					id: {
						type: 'integer',
						description: 'The scene number.',
					},
					narration: {
						type: 'string',
						description: 'The audio text for this scene.',
					},
					visualConcept: {
						type: 'string',
						description: 'The visual concept for this scene.',
					},
					textOverlay: {
						type: 'string',
						description: 'The text overlay for this scene.',
						nullable: true,
					},
				},
				required: ['id', 'narration', 'visualConcept', 'textOverlay'],
				additionalProperties: false,
			},
		},
	},
	required: ['storyboard'],
	additionalProperties: false,
};

export const storyboardStructure: ResponseFormatJSONSchema = {
	type: 'json_schema',
	json_schema: {
		name: 'storyboard_structure',
		strict: true,
		schema: storyboardStructureSchemaAsObject,
	},
};
