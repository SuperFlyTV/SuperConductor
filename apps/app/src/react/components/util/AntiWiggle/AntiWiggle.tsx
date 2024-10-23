import { cloneDeep, isEqual } from 'lodash-es'
import * as React from 'react'

import './style.scss'

/**
 * Wrap the content in a div which expands to the size of the content.
 * Prevents shrinking of the container.
 * This is useful for content which rapidly change its size (like a countdown number)
 */
export const AntiWiggle: React.FC<{
	/** Duration to wait before allowing shrinking of the container size (Defaults to 10 seconds) [ms] */
	shrinkDuration?: number
	/** Allow shrink whenever these dependencies change */
	deps?: React.DependencyList
	children: React.ReactNode
}> = (props) => {
	const refOuter = React.useRef<HTMLDivElement>(null)
	const refInner = React.useRef<HTMLDivElement>(null)

	const dimensions = React.useRef({
		width: 0,
		height: 0,
		growTime: 0,
	})

	const shrinkDuration = props.shrinkDuration ?? 10 * 1000 // Default: 10 seconds

	const updateSize = React.useCallback(() => {
		if (refInner.current && refOuter.current) {
			const { width, height } = refInner.current.getBoundingClientRect()
			let d = cloneDeep(dimensions.current)
			if (d.width < width || d.height < height) {
				// Make larger
				d = {
					width: Math.max(d.width, width),
					height: Math.max(d.height, height),
					growTime: Date.now(),
				}
			} else if (d.width === width && d.height === height) {
				// Keep size
				d.growTime = Date.now()
			} else if (Date.now() - d.growTime > shrinkDuration) {
				// Make smaller
				d.width = width
				d.height = height
			}

			if (!isEqual(d, dimensions.current)) {
				refOuter.current.style.width = d.width + 'px'
				refOuter.current.style.height = d.height + 'px'
				dimensions.current = d
			}
		}
	}, [shrinkDuration])

	// Reset size upon props.deps change:
	React.useEffect(() => {
		dimensions.current = {
			width: 0,
			height: 0,
			growTime: 0,
		}
		updateSize()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, props.deps)

	// Update size whenever any children change:
	React.useLayoutEffect(() => {
		updateSize()
	}, [props.children, updateSize])

	return (
		<div className="anti-wiggle" ref={refOuter}>
			<div className="anti-wiggle__inner" ref={refInner}>
				{props.children}
			</div>
		</div>
	)
}
