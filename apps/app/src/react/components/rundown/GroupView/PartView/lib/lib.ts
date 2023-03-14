import { useCallback, useRef, useState } from 'react'
import { store } from '../../../../../mobx/store'
import { useMemoComputedObject } from '../../../../../mobx/lib'
import { ResolvedTimeline, Resolver, ResolverCache } from 'superfly-timeline'
import { getResolvedTimelineTotalDuration } from '../../../../../../lib/util'

/** Returns a few common methods that are used by the PartViwes */
export function getPartMethods(arg: {
	rundownId: string
	parentGroupId: string
	partId: string
	partDuration: number | undefined
}) {
	const cache = useRef<ResolverCache>({})
	const { orgMaxDuration, orgResolvedTimeline, resolverErrorMessage, partTimeline } = useMemoComputedObject(() => {
		let errorMessage = ''

		const partTimeline = store.rundownsStore.getPartTimeline(arg.partId)
		let orgResolvedTimeline: ResolvedTimeline
		try {
			orgResolvedTimeline = Resolver.resolveTimeline(
				partTimeline.map((o) => o.obj),
				{ time: 0, cache: cache.current }
			)
			/** Max duration for display. Infinite objects are counted to this */
		} catch (e) {
			orgResolvedTimeline = {
				options: {
					time: Date.now(),
				},
				objects: {},
				classes: {},
				layers: {},
				statistics: {
					unresolvedCount: 0,
					resolvedCount: 0,
					resolvedInstanceCount: 0,
					resolvedObjectCount: 0,
					resolvedGroupCount: 0,
					resolvedKeyframeCount: 0,
					resolvingCount: 0,
				},
			}
			errorMessage = `Fatal error in timeline: ${e}`
		}

		return {
			orgResolvedTimeline,
			orgMaxDuration: orgResolvedTimeline
				? arg.partDuration ?? getResolvedTimelineTotalDuration(orgResolvedTimeline, true)
				: 0,
			resolverErrorMessage: errorMessage,
			partTimeline,
		}
		// }, [part.timeline, trackWidth])
	}, [arg.partId, arg.partDuration])

	// This is used to defer initial rendering of some components, in order to improve initial rendering times:
	const [renderEverything, setRenderEverything] = useState(false)
	const onVisibilityChange = useCallback((isVisible: boolean) => {
		setTimeout(() => {
			setRenderEverything(isVisible)
		}, 1)
	}, [])

	return {
		orgMaxDuration,
		orgResolvedTimeline,
		resolverErrorMessage,
		partTimeline,
		cache,

		renderEverything,
		onVisibilityChange,
	}
}
