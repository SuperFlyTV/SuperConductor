import React, { useState, useEffect } from 'react'
import { GDDSchema } from 'graphics-data-definition'
import { TSRTimelineContent, TSRTimelineObj } from 'timeline-state-resolver-types'

import './style.scss'
import { componentAny } from './componentAny.js'
import { deepClone } from '@shared/lib'
import { OnSave } from '../timelineObjs/lib.js'

export const EditGDDData: React.FC<{
	objs: TSRTimelineObj<TSRTimelineContent>[]

	schema: GDDSchema
	data: any
	onSaveObj: OnSave
	onSaveContentData: (newData: any) => void
}> = ({ objs, schema, data, onSaveContentData, onSaveObj }) => {
	// clone, since the data is edited internally:
	const [currentData, setCurrentData] = useState(JSON.parse(JSON.stringify(data)))

	useEffect(() => {
		// clone, since the data is edited internally:
		setCurrentData(JSON.parse(JSON.stringify(data)))
	}, [data])

	const updateCurrentData = (data: any) => {
		setCurrentData(deepClone(data))
	}
	const onSave = () => {
		onSaveContentData(currentData)
	}

	return (
		<div className="gdd-edit-data">
			{componentAny({
				objs: objs,
				fullPath: [],
				onSaveObj,
				schema: schema,
				data: currentData,
				setData: updateCurrentData,
				onSave,
				property: '',
			})}
		</div>
	)
}
