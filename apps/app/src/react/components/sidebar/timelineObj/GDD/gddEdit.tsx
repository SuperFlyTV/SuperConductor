import React, { useState, useEffect } from 'react'
import { GDDSchema } from 'graphics-data-definition'

import './style.scss'
import { clone } from 'lodash'
import { componentAny } from './componentAny'

export const EditGDDData: React.FC<{
	schema: GDDSchema
	data: any
	onSaveData: (newData: any) => void
}> = ({ schema, data, onSaveData }) => {
	// const setData = (data) => {
	// 	props.setData(data)
	// }

	const [currentData, setCurrentData] = useState(data)
	useEffect(() => {
		setCurrentData(data)
	}, [data])

	const updateCurrentData = (data: any) => {
		setCurrentData(clone(data))
	}
	const onBlur = () => {
		onSaveData(currentData)
	}

	return (
		<div className="gdd-edit-data">
			{componentAny({
				schema: schema,
				data: currentData,
				setData: updateCurrentData,
				onSave: onBlur,
				property: '',
			})}
		</div>
	)
}
