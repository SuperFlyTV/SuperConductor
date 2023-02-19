import { assertNever, compact } from '@shared/lib'
import { CB } from '../../lib/errorHandling'
import { store } from '../../mobx/store'
import { handleCasparCGClient } from './casparCGClient'
import { handleConvenience } from './convenience'
import { ClipBoardInternal, ClipBoardInternalAny, handleInternal } from './internal'
import { ClipBoardContext } from './lib'

export function setupClipboard(context: ClipBoardContext): void {
	// This function is called once, when the app is started.

	document.addEventListener(
		'cut',
		CB((e: ClipboardEvent) => {
			const copied = copySelectionToClipboard(e, context)
			if (copied) {
				removeCopied(copied, context).catch(context.handleError)

				e.preventDefault()
			}
		})
	)
	document.addEventListener(
		'copy',
		CB((e: ClipboardEvent) => {
			if (copySelectionToClipboard(e, context)) {
				e.preventDefault()
			}
		})
	)
	document.addEventListener(
		'paste',
		CB(() => {
			if (!document.hasFocus()) return

			navigator.clipboard
				.read()
				.then(async (clipboardContents) => {
					for (const item of clipboardContents) {
						if (!item.types.includes('image/png')) {
							// const blob = await item.getType('image/png')
							// destinationImage.src = URL.createObjectURL(blob)
							// return
						}
						if (!item.types.includes('text/html')) {
							// return
						}
						if (item.types.includes('text/plain')) {
							const blob = await item.getType('text/plain')
							const str = await blob.text()

							if (await handleInternal(context, str)) return
							if (await handleCasparCGClient(context, str)) return
							if (await handleConvenience(context, str)) return

							// eslint-disable-next-line no-console
							console.error('Unhandled paste:', str)
						}
					}
				})
				.catch(context.handleError)
		})
	)
}

function copySelectionToClipboard(e: ClipboardEvent, context: ClipBoardContext): ClipBoardInternal | null {
	if ((e.target as Element)?.tagName === 'INPUT') return null

	const currentRundownId = store.rundownsStore.currentRundownId
	if (!currentRundownId) return null

	const selectedObjects: ClipBoardInternalAny[] = compact(
		store.guiStore.selected.map<ClipBoardInternalAny | undefined>((selected) => {
			if (selected.type === 'group') {
				const group = store.rundownsStore.getGroupRaw(currentRundownId, selected.groupId)
				if (group) return { type: 'group', group }
			} else if (selected.type === 'part') {
				const part = store.rundownsStore.getPartRaw(currentRundownId, selected.groupId, selected.partId)
				if (part) return { type: 'part', groupId: selected.groupId, part }
			} else if (selected.type === 'timelineObj') {
				const part = store.rundownsStore.getPartRaw(currentRundownId, selected.groupId, selected.partId)
				const timelineObj = part?.timeline.find((t) => t.obj.id === selected.timelineObjId)
				if (timelineObj)
					return { type: 'timelineObj', groupId: selected.groupId, partId: selected.partId, timelineObj }
			} else {
				assertNever(selected)
				return undefined
			}
		})
	)

	const clipBoardData: ClipBoardInternal = {
		type: 'SuperConductor',
		items: selectedObjects,
	}
	navigator.clipboard.writeText(JSON.stringify(clipBoardData)).catch((err) => {
		context.handleError('Async: Could not copy text: ' + err)
	})
	return clipBoardData
}
async function removeCopied(copied: ClipBoardInternal, context: ClipBoardContext) {
	const currentRundownId = store.rundownsStore.currentRundownId
	if (!currentRundownId) return null

	for (const item of copied.items) {
		if (item.type === 'group') {
			await context.serverAPI.deleteGroup({
				rundownId: currentRundownId,
				groupId: item.group.id,
			})
		} else if (item.type === 'part') {
			await context.serverAPI.deletePart({
				rundownId: currentRundownId,
				groupId: item.groupId,
				partId: item.part.id,
			})
		} else if (item.type === 'timelineObj') {
			await context.serverAPI.deleteTimelineObj({
				rundownId: currentRundownId,
				groupId: item.groupId,
				partId: item.partId,
				timelineObjId: item.timelineObj.obj.id,
			})
		} else {
			assertNever(item)
		}
	}
}
