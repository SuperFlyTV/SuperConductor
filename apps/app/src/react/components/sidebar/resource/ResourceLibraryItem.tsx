import React, { useCallback, useMemo } from 'react'
import classNames from 'classnames'
import { ResourceAny, ResourceType } from '@shared/models'
import { useDrag } from 'react-dnd'
import { DragItemTypes, ResourceDragItem } from '../../../api/DragItemTypes'
import { assertNever, bytesToSize, compact, describeResource } from '@shared/lib'
import { formatDurationLabeled } from '../../../../lib/timeLib'
import { ResourceLibraryItemThumbnail } from './ResourceLibraryItemThumbnail'
import { store } from '../../../mobx/store'

type IProps = {
	resource: ResourceAny
	selected: boolean
	onSelect?: (resource: ResourceAny) => void
}

export const ResourceLibraryItem = function ResourceLibraryItem({ resource, selected, onSelect }: IProps): JSX.Element {
	const [{ dragged }, dragRef] = useDrag(
		() => ({
			type: DragItemTypes.RESOURCE_ITEM,
			item: (): ResourceDragItem => {
				const selectedResourceIds = store.guiStore.resourceLibrary.selectedResourceIds

				// If this resource is a selected resource, drag all selected resources.
				// otherwise, drag just this resource.
				if (selectedResourceIds.includes(resource.id)) {
					const storeResources = store.resourcesAndMetadataStore.resources
					const resources = compact(
						selectedResourceIds.map((resourceId) => {
							return storeResources.get(resourceId)
						})
					)
					return { type: DragItemTypes.RESOURCE_ITEM, resources }
				} else {
					return { type: DragItemTypes.RESOURCE_ITEM, resources: [resource] }
				}
			},
			collect: (monitor) => ({
				dragged: monitor.isDragging() ? true : false,
			}),
		}),
		[resource]
	)

	const resourceType = describeResource(resource)

	const clickHandler = useCallback(() => onSelect && onSelect(resource), [onSelect, resource])

	const content = useMemo((): React.ReactNode => {
		if (resource.resourceType === ResourceType.CASPARCG_MEDIA) {
			return (
				<>
					<ResourceLibraryItemThumbnail resource={resource} />
					<div className="resource__details">
						<div className="resource__name" title={resource.displayName}>
							{resource.displayName}
						</div>
						<div className="resource__attributes">
							<div>{resource.type}</div>
							<div style={{ textAlign: 'right' }}>{bytesToSize(resource.size)}</div>
							<div style={{ textAlign: 'right' }}>{formatDurationLabeled(resource.duration * 1000)}</div>
						</div>
					</div>
				</>
			)
		} else if (resource.resourceType === ResourceType.CASPARCG_SERVER) {
			return <></>
		} else if (resource.resourceType === ResourceType.VMIX_INPUT) {
			return (
				<>
					<div className="resource__details">
						<div className="resource__name" title={resource.displayName}>
							{resource.displayName}
						</div>
						<div className="resource__attributes">
							<div>{resource.type}</div>
						</div>
					</div>
				</>
			)
		} else if (
			resource.resourceType === ResourceType.VMIX_INPUT_SETTINGS ||
			resource.resourceType === ResourceType.VMIX_AUDIO_SETTINGS ||
			resource.resourceType === ResourceType.VMIX_OUTPUT_SETTINGS ||
			resource.resourceType === ResourceType.VMIX_OVERLAY_SETTINGS ||
			resource.resourceType === ResourceType.VMIX_RECORDING ||
			resource.resourceType === ResourceType.VMIX_STREAMING ||
			resource.resourceType === ResourceType.VMIX_EXTERNAL ||
			resource.resourceType === ResourceType.VMIX_FADE_TO_BLACK ||
			resource.resourceType === ResourceType.VMIX_FADER ||
			resource.resourceType === ResourceType.VMIX_PREVIEW ||
			resource.resourceType === ResourceType.VMIX_SCRIPT ||
			resource.resourceType === ResourceType.OSC_MESSAGE ||
			resource.resourceType === ResourceType.OBS_RENDER ||
			resource.resourceType === ResourceType.OBS_MUTE ||
			resource.resourceType === ResourceType.OBS_SOURCE_SETTINGS ||
			resource.resourceType === ResourceType.OBS_STREAMING ||
			resource.resourceType === ResourceType.OBS_RECORDING ||
			resource.resourceType === ResourceType.OBS_TRANSITION ||
			resource.resourceType === ResourceType.OBS_SCENE ||
			resource.resourceType === ResourceType.ATEM_MEDIA_PLAYER ||
			resource.resourceType === ResourceType.ATEM_AUDIO_CHANNEL ||
			resource.resourceType === ResourceType.ATEM_AUDIO_OUTPUT ||
			resource.resourceType === ResourceType.ATEM_MACRO_PLAYER ||
			resource.resourceType === ResourceType.ATEM_SSRC_PROPS ||
			resource.resourceType === ResourceType.ATEM_SSRC ||
			resource.resourceType === ResourceType.ATEM_AUX ||
			resource.resourceType === ResourceType.ATEM_DSK ||
			resource.resourceType === ResourceType.ATEM_ME ||
			resource.resourceType === ResourceType.CASPARCG_TEMPLATE ||
			resource.resourceType === ResourceType.HTTP_REQUEST ||
			resource.resourceType === ResourceType.HYPERDECK_PLAY ||
			resource.resourceType === ResourceType.HYPERDECK_RECORD ||
			resource.resourceType === ResourceType.HYPERDECK_PREVIEW ||
			resource.resourceType === ResourceType.HYPERDECK_CLIP ||
			resource.resourceType === ResourceType.TCP_REQUEST
		) {
			return (
				<>
					<div className="resource__name">{resource.displayName}</div>
				</>
			)
		} else {
			assertNever(resource)
			return <></>
		}
	}, [resource])

	return (
		<div
			ref={dragRef}
			className={classNames('resource', resourceType, {
				selected,
				dragged,
			})}
			onClick={clickHandler}
		>
			{content}
		</div>
	)
}
