import React, { useEffect, useState } from 'react'
import { AppModel } from '@/models/AppModel'
import { MediaInfo } from './MediaInfo'
import { InfoGroup } from './InfoGroup'
import { MediaModel } from '@/models/MediaModel'

type PropsType = {
	appData: AppModel
}

export const MediaLibrary = (props: PropsType) => {
	const [selectedFilename, setSelectedFilename] = useState<string | undefined>()

	return (
		<div className="sidebar media-library-sidebar">
			<InfoGroup title="Available media">
				<div className="template-data">
					<table>
						<thead>
							<tr>
								<th>Name</th>
								<th>Type</th>
								<th>Size</th>
								<th>Frame count</th>
								<th>Size</th>
							</tr>
						</thead>
						<tbody>
							{props.appData.media.map((item) => {
								return (
									<tr
										key={item.filename}
										onClick={() => {
											setSelectedFilename(item.filename)
										}}
									>
										<td>{item.filename}</td>
										<td>{item.type}</td>
										<td>{item.filesize}</td>
										<td>{item.frameCount}</td>
										<td>{item.frameRateDuration}</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				</div>
			</InfoGroup>
		</div>
	)
}
