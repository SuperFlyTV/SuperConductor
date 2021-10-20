import { SELECT_TIMELINE_OBJ_CHANNEL } from '@/ipc/channels'
import classNames from 'classnames'
import React, { MouseEventHandler } from 'react'
import Timeline from 'superfly-timeline'
import { Menu, Item, useContextMenu, ItemParams } from 'react-contexify'
import 'react-contexify/dist/ReactContexify.css'
const { ipcRenderer } = window.require('electron')

type PropsType = {
	layerId: string
	totalDuration: number
	timelineObjs: Timeline.ResolvedTimelineObject[]
	selectedTimelineObjId?: string
}

export const Layer = (props: PropsType) => {
	const MENU_ID = 'layer-obj-context-menu'

	const { show } = useContextMenu({
		id: MENU_ID,
	})

	const handleContextMenu = (id: number) => {
		const returnFunction: MouseEventHandler<HTMLDivElement> = (event) => {
			event.preventDefault()
			show(event, { props: { id } })
		}
		return returnFunction
	}

	const handleItemClick = ({ props }: ItemParams<{ id: number }>) => {
		console.log(props)
	}

	return (
		<div className="layer">
			<Menu id={MENU_ID}>
				<Item onClick={handleItemClick}>Item 1</Item>
				<Item onClick={handleItemClick}>Item 2</Item>
			</Menu>

			<div className="layer__content">
				{props.timelineObjs.map((timelineObj) => {
					const start = (timelineObj.enable as any).start
					const duration = (timelineObj.enable as any).duration

					const widthPercentage = (duration / props.totalDuration) * 100 + '%'
					const startPercentage = (start / props.totalDuration) * 100 + '%'

					return (
						<div
							key={timelineObj.id}
							onContextMenu={handleContextMenu(1)}
							className={classNames({
								object: true,
								[timelineObj.content.type]: true,
								selected: props.selectedTimelineObjId === timelineObj.id,
							})}
							style={{ width: widthPercentage, left: startPercentage }}
							onClick={() => {
								ipcRenderer.send(SELECT_TIMELINE_OBJ_CHANNEL, timelineObj.id)
							}}
						>
							<div className="title">{timelineObj.content.file || timelineObj.content.name}</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}
