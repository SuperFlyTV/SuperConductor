import React from 'react'
import { MediaModel } from '@/models/MediaModel'

type PropsType = {
	media: MediaModel
}

export const Sidebar = (props: PropsType) => {
	return (
		<div className="sidebar">
			<div className="title">{props.media.filename}</div>
			<DataRow label="Type" value={props.media.type} />
			<DataRow label="Filesize" value={props.media.filesize} />
			<DataRow label="Last modified" value={props.media.lastModified} />
			<DataRow label="Frame count" value={props.media.frameCount} />
			<DataRow label="Frame rate/duration" value={props.media.frameRateDuration} />
			<TemplateData />
		</div>
	)
}

const DataRow = (props: { label: string; value: any }) => {
	return (
		<div className="row">
			<div className="label">{props.label}</div>
			<div className="value">{props.value}</div>
		</div>
	)
}

const TemplateData = () => {
	return (
		<div className="template-data">
			<div className="title">Template data</div>
			<table>
				<tr>
					<th>Key</th>
					<th>Value</th>
				</tr>
				<tr>
					<td>_name</td>
					<td>John Doe</td>
				</tr>
				<tr>
					<td>_name</td>
					<td>John Doe</td>
				</tr>
				<tr>
					<td>_name</td>
					<td>John Doe</td>
				</tr>
				<tr>
					<td>_name</td>
					<td>John Doe</td>
				</tr>
			</table>
			<button>Add</button>
		</div>
	)
}
