import React from 'react'
import { GDDSchema, GDDSchemaProperty, GDDTypes, validateData } from 'graphics-data-definition'
import { ComponentAnyProps, getBasicType, PropertyProps } from './lib'
import {
	basicPropertyBoolean,
	basicPropertyString,
	basicPropertyNumber,
	basicPropertyInteger,
	basicPropertyArray,
	basicPropertyObject,
	basicPropertyUnknown,
} from './basicProperties'
import { gddTypeSingleLine } from './GDDTypes/string-single-line'
import { assertNever } from '@shared/lib'
import { gddTypeMultiLine } from './GDDTypes/string-multi-line'
import { gddTypeSelect } from './GDDTypes/select'
import { gddTypeColorRRGGBB } from './GDDTypes/string-color-rrggbb'

export const componentAny: React.FC<ComponentAnyProps<GDDSchemaProperty>> = (props) => {
	const schema = props.schema

	const innerProps: PropertyProps<any> = {
		...props,
		key: String(props.property),
		dataValidation: validateData(schema as GDDSchema, props.data),
	}

	{
		// Handle GDD Types:
		const gddSchema = schema as GDDTypes

		if (gddSchema.type === 'string') {
			if (gddSchema.gddType === 'single-line') return gddTypeSingleLine(innerProps)
			else if (gddSchema.gddType === 'multi-line') return gddTypeMultiLine(innerProps)
			else if (gddSchema.gddType === 'select') return gddTypeSelect(innerProps)
			else if (gddSchema.gddType === 'color-rrggbb') return gddTypeColorRRGGBB(innerProps)
			// else if (gddSchema.gddType === 'file-path') return gddTypeFilePath(innerProps)
			// else if (gddSchema.gddType === 'file-path/image-path') return gddTypeFilePathImagePath(innerProps)
			// else assertNever(gddSchema)
		} else if (gddSchema.type === 'integer') {
			if (gddSchema.gddType === 'select') return gddTypeSelect(innerProps)
			// else assertNever(gddSchema)
		} else if (gddSchema.type === 'number') {
			if (gddSchema.gddType === 'select') return gddTypeSelect(innerProps)
			// else if (gddSchema.gddType === 'duration-ms') return gddTypeDurationMS(innerProps)
			// else if (gddSchema.gddType === 'percentage') return gddTypePercentage(innerProps)
			// else assertNever(gddSchema)
		} else {
			assertNever(gddSchema)
		}
	}

	{
		// Handle basic types:
		const basicType = getBasicType(schema.type)

		if (basicType === 'boolean') return basicPropertyBoolean(innerProps)
		if (basicType === 'string') return basicPropertyString(innerProps)
		if (basicType === 'number') return basicPropertyNumber(innerProps)
		if (basicType === 'integer') return basicPropertyInteger(innerProps)
		if (basicType === 'array') return basicPropertyArray(innerProps)
		if (basicType === 'object') return basicPropertyObject(innerProps)

		// Fallback:
		return basicPropertyUnknown({ ...innerProps, basicType })
	}
}
