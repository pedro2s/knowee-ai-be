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
					scene: {
						type: 'integer',
						description: 'The scene number.',
					},
					audioText: {
						type: 'string',
						description: 'The audio text for this scene.',
					},
					visual: {
						type: 'object',
						properties: {
							type: {
								type: 'string',
								description:
									'The image type for this scene. It could be: stock_video (to retrieve a video from a stock image bank); generated_image (to create an AI-powered illustration); title_card (a slide with highlighted text).',
								enum: ['stock_video', 'generated_image', 'title_card'],
							},
							searchQuery: {
								type: 'string',
								description:
									'The search query for this scene. It should be purely visual, without text.',
							},
						},
						required: ['type', 'searchQuery'],
						additionalProperties: false,
					},
					textOverlay: {
						type: 'string',
						description: 'The text overlay for this scene.',
						nullable: true,
					},
				},
				required: ['scene', 'audioText', 'visual', 'textOverlay'],
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
