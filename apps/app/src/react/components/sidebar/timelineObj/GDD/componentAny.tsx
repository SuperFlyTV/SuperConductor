import React from 'react'
import { GDDSchema, GDDSchemaProperty, validateData } from 'graphics-data-definition'
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

export const componentAny: React.FC<ComponentAnyProps<GDDSchemaProperty>> = (props) => {
	// if (!props.schema) return null

	const basicType = getBasicType(props.schema.type)

	const innerProps: PropertyProps<any> = {
		...props,
		key: String(props.property),
		dataValidation: validateData(props.schema as GDDSchema, props.data),
	}

	if (basicType === 'boolean') return basicPropertyBoolean(innerProps)
	if (basicType === 'string') return basicPropertyString(innerProps)
	if (basicType === 'number') return basicPropertyNumber(innerProps)
	if (basicType === 'integer') return basicPropertyInteger(innerProps)
	if (basicType === 'array') return basicPropertyArray(innerProps)
	if (basicType === 'object') return basicPropertyObject(innerProps)

	return basicPropertyUnknown({ ...innerProps, basicType })
}
