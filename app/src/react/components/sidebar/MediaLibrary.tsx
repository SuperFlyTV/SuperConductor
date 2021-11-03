import React, { MouseEventHandler, useEffect, useState } from 'react'
import { AppModel } from '@/models/AppModel'
import { InfoGroup } from './InfoGroup'
import { MediaInfo } from './MediaInfo'
import { Field, Form, Formik, FormikProps } from 'formik'
import { ADD_MEDIA_TO_TIMELINE_CHANNEL, IAddMediaToTimelineChannel } from '@/ipc/channels'
import { bytesToSize } from '@/lib/bytesToSize'
import { getAllRundowns, getDefaultMappingLayer, getDefaultRundownId } from '@/lib/getDefaults'
import classNames from 'classnames'
const { ipcRenderer } = window.require('electron')

type PropsType = {
	appData: AppModel
}

export const MediaLibrary = (props: PropsType) => {
	const [selectedFilename, setSelectedFilename] = useState<string | undefined>()

	const selectedMedia = props.appData.media.find((item) => item.filename === selectedFilename)

	const defaultRundownId = getDefaultRundownId(props.appData.rundowns)
	const defaultLayer = getDefaultMappingLayer(props.appData.mappings)

	return (
		<div className="sidebar media-library-sidebar">
			<InfoGroup title="Available media">
				<table className="selectable">
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
										if (selectedFilename === item.filename) {
											setSelectedFilename(undefined)
										} else {
											setSelectedFilename(item.filename)
										}
									}}
									className={classNames({ selected: item.filename === selectedFilename })}
								>
									<td>{item.filename}</td>
									<td>{item.type}</td>
									<td>{bytesToSize(item.filesize)}</td>
									<td>{item.frameCount ? item.frameCount : ''}</td>
									<td>{item.frameRateDuration}</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</InfoGroup>

			{selectedMedia && (
				<>
					<MediaInfo media={selectedMedia} />
					{defaultRundownId && defaultLayer && (
						<div className="add-to-timeline">
							<Formik
								initialValues={{ rundownId: defaultRundownId, layerId: defaultLayer }}
								onSubmit={(values, actions) => {
									if (!values.rundownId || !values.layerId) {
										return
									}

									const data: IAddMediaToTimelineChannel = {
										rundownId: values.rundownId,
										layerId: values.layerId,
										filename: selectedMedia.filename,
									}
									ipcRenderer.send(ADD_MEDIA_TO_TIMELINE_CHANNEL, data)
								}}
							>
								{(fProps: FormikProps<any>) => (
									<Form>
										<div className="label">Add to timeline</div>
										<div className="dropdowns">
											<Field as="select" name="rundownId">
												{getAllRundowns(props.appData.rundowns).map((rd) => {
													if (rd.type === 'rundown') {
														return (
															<option key={rd.id} value={rd.id}>
																{rd.name}
															</option>
														)
													}
												})}
											</Field>
											<Field as="select" name="layerId">
												{props.appData.mappings &&
													Object.keys(props.appData.mappings).map((key) => (
														<option key={key} value={key}>
															{key}
														</option>
													))}
											</Field>
										</div>
										<div className="btn-row-right">
											<button className="btn form" type="submit">
												Add
											</button>
										</div>
									</Form>
								)}
							</Formik>
						</div>
					)}
				</>
			)}
		</div>
	)
}
