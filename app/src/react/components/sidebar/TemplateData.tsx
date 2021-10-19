import React from 'react'
import { InfoGroup } from './InfoGroup'

type TemplateData = {
	[id: string]: string
}

export const TemplateData = (props: { templateData: TemplateData }) => {
	return (
		<InfoGroup title="Template data">
			<div className="template-data">
				<table>
					<thead>
						<tr>
							<th>Key</th>
							<th>Value</th>
						</tr>
					</thead>
					<tbody>
						{Object.keys(props.templateData).map((key) => {
							return (
								<tr key={key}>
									<td>{key}</td>
									<td>{props.templateData[key]}</td>
								</tr>
							)
						})}
					</tbody>
				</table>
				<div className="btn-row-right">
					<button className="btn form">Add</button>
				</div>
			</div>
		</InfoGroup>
	)
}
