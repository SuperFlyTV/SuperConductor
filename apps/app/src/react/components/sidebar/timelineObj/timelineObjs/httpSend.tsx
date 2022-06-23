import { Button, Stack, Typography } from '@mui/material'
import React from 'react'
import { TimelineContentTypeHTTP, TimelineObjHTTPSendAny } from 'timeline-state-resolver-types'
import { IntInput } from '../../../inputs/IntInput'
import { SelectEnum } from '../../../inputs/SelectEnum'
import { TextInput } from '../../../inputs/TextInput'
import { TrashBtn } from '../../../inputs/TrashBtn'
import { EditWrapper, OnSave } from './lib'

export const EditTimelineObjHTTPSendAny: React.FC<{ obj: TimelineObjHTTPSendAny; onSave: OnSave }> = ({
	obj,
	onSave,
}) => {
	return (
		<EditWrapper obj={obj} onSave={onSave}>
			<div className="setting">
				<SelectEnum
					label="Request Type"
					fullWidth
					currentValue={obj.content.type}
					options={TimelineContentTypeHTTP}
					onChange={(v: TimelineContentTypeHTTP) => {
						obj.content.type = v
						onSave(obj)
					}}
					allowUndefined={false}
				/>
			</div>

			<div className="setting">
				<TextInput
					label="URL"
					fullWidth
					currentValue={obj.content.url}
					onChange={(v) => {
						obj.content.url = v
						onSave(obj)
					}}
					allowUndefined={false}
				/>
			</div>

			{Object.entries(obj.content.params).map(([key, value], index) => (
				<React.Fragment key={index}>
					<Stack direction="row" justifyContent="space-between">
						<Typography variant="body2">Param #{index}</Typography>
						<TrashBtn
							onClick={() => {
								delete obj.content.params[key]
								onSave(obj)
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
								obj.content.params[v] = value
								delete obj.content.params[key]
								onSave(obj)
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
								obj.content.params[key] = v
								onSave(obj)
							}}
							allowUndefined={false}
						/>
					</div>
				</React.Fragment>
			))}

			<Button
				style={{ marginBottom: '1rem' }}
				variant="contained"
				onClick={() => {
					const numParams = Object.keys(obj.content.params).length
					obj.content.params[`param${numParams}`] = 'value'
					onSave(obj)
				}}
			>
				Add Parameter
			</Button>

			<div className="setting">
				<IntInput
					label="Temporal Priority"
					fullWidth
					currentValue={obj.content.temporalPriority}
					onChange={(v) => {
						obj.content.temporalPriority = v
						onSave(obj)
					}}
					allowUndefined={true}
				/>
			</div>

			<div className="setting">
				<TextInput
					label="Queue ID"
					fullWidth
					currentValue={obj.content.queueId}
					onChange={(v) => {
						obj.content.queueId = v
						onSave(obj)
					}}
					allowUndefined={true}
				/>
			</div>
		</EditWrapper>
	)
}
