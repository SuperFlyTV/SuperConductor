import React, { useState, useEffect } from 'react'
import { GDDSchema } from 'graphics-data-definition'

import './style.scss'
import { componentAny } from './componentAny'
import { deepClone } from '@shared/lib'

export const EditGDDData: React.FC<{
	schema: GDDSchema
	data: any
	onSaveData: (newData: any) => void
}> = ({ schema, data, onSaveData }) => {
	// clone, since the data is edited internally:
	const [currentData, setCurrentData] = useState(JSON.parse(JSON.stringify(data)))

	useEffect(() => {
		// clone, since the data is edited internally:
		setCurrentData(JSON.parse(JSON.stringify(data)))
	}, [data])

	const updateCurrentData = (data: any) => {
		setCurrentData(deepClone(data))
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
