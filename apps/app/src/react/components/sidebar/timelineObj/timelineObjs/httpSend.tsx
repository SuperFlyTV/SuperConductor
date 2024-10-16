import { Button, Stack, Typography } from '@mui/material'
import React from 'react'
import { TSRTimelineObj, TimelineContentHTTPSendAny, TimelineContentTypeHTTP } from 'timeline-state-resolver-types'
import { inputValue, isIndeterminate } from '../../../../lib/multipleEdit.js'
import { IntInput } from '../../../inputs/IntInput.js'
import { SelectEnum } from '../../../inputs/SelectEnum.js'
import { TextInput } from '../../../inputs/TextInput.js'
import { TrashBtn } from '../../../inputs/TrashBtn.js'
import { EditWrapper, OnSave, OnSaveType } from './lib.js'

export const EditTimelineObjHTTPSendAny: React.FC<{
	objs: TSRTimelineObj<TimelineContentHTTPSendAny>[]
	onSave: OnSave
}> = ({ objs, onSave: onSave0 }) => {
	const onSave = onSave0 as OnSaveType<TSRTimelineObj<TimelineContentHTTPSendAny>>

	const firstObj = objs[0]
	if (!firstObj) return null

	return (
		<EditWrapper objs={objs} onSave={onSave0}>
			<div className="setting">
				<SelectEnum
					label="Request Type"
					fullWidth
					{...inputValue(objs, (obj) => obj.content.type, undefined)}
					options={TimelineContentTypeHTTP}
					onChange={(v: TimelineContentTypeHTTP) => {
						onSave({ content: { type: v } })
					}}
					allowUndefined={false}
				/>
			</div>

			<div className="setting">
				<TextInput
					label="URL"
					fullWidth
					{...inputValue(objs, (obj) => obj.content.url, '')}
					onChange={(v) => {
						onSave({ content: { url: v } })
					}}
					allowUndefined={false}
				/>
			</div>
			<>
				{isIndeterminate(objs, (obj) => obj.content.params) ? (
					<>-- Different values -- </>
				) : (
					<>
						{Object.entries<any>(firstObj.content.params || {}).map(([key, value], index) => {
							if (value === undefined) return null
							return (
								<React.Fragment key={index}>
									<Stack direction="row" justifyContent="space-between">
										<Typography variant="body2">Param #{index}</Typography>
										<TrashBtn
											onClick={() => {
												onSave({ content: { params: { [key]: undefined } } })
											}}
											title="Delete parameter"
										/>
									</Stack>

									<div className="setting">
										<TextInput
											label="Key"
											fullWidth
											currentValue={key}
											onChange={(v) => {
												// Ensure that the key is unique:
												let i = 0
												const objectUpdates = {
													content: {
														params: {
															[v]: value,
														},
													},
												}
												if (v !== key) {
													let vUnique = v
													while (firstObj.content.params[vUnique] !== undefined) {
														i++
														vUnique = `${v}_${i}`
													}
													objectUpdates.content.params = {
														[vUnique]: value,
														[key]: undefined,
													}
												}
												onSave(objectUpdates)
											}}
											allowUndefined={false}
										/>
									</div>

									<div className="setting">
										<TextInput
											label="Value"
											fullWidth
											currentValue={value}
											onChange={(v) => {
												onSave({ content: { params: { [key]: v } } })
											}}
											allowUndefined={false}
										/>
									</div>
								</React.Fragment>
							)
						})}
						<Button
							style={{ marginBottom: '1rem' }}
							variant="contained"
							onClick={() => {
								const numParams = Object.keys(firstObj.content.params).length
								const key = `param${numParams}`
								let i = 0
								let keyUnique = key
								while (firstObj.content.params[keyUnique] !== undefined) {
									i++
									keyUnique = `${key}_${i}`
								}
								onSave({ content: { params: { [keyUnique]: 'value' } } })
							}}
						>
							Add Parameter
						</Button>
					</>
				)}
			</>

			<div className="setting">
				<IntInput
					label="Temporal Priority"
					fullWidth
					{...inputValue(objs, (obj) => obj.content.temporalPriority, undefined)}
					onChange={(v) => {
						onSave({ content: { temporalPriority: v } })
					}}
					allowUndefined={true}
				/>
			</div>

			<div className="setting">
				<TextInput
					label="Queue ID"
					fullWidth
					{...inputValue(objs, (obj) => obj.content.queueId, undefined)}
					onChange={(v) => {
						onSave({ content: { queueId: v } })
					}}
					allowUndefined={true}
				/>
			</div>
		</EditWrapper>
	)
}
