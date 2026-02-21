import { ResponseFormatJSONSchema } from 'openai/resources';

export const reorderContentStructureSchemaAsObject = {
	type: 'object',
	properties: {
		modules: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: {
						type: 'string',
						format: 'uuid',
						description: 'The module id to reorder.',
					},
					orderIndex: {
						type: 'integer',
						description: 'The new order index for the module.',
					},
				},
				required: ['id', 'orderIndex'],
				additionalProperties: false,
			},
		},
	},
	required: ['modules'],
	additionalProperties: false,
};

export const reorderContentStructure: ResponseFormatJSONSchema = {
	type: 'json_schema',
	json_schema: {
		name: 'reorder_content_structure',
		strict: true,
		schema: reorderContentStructureSchemaAsObject,
	},
};
