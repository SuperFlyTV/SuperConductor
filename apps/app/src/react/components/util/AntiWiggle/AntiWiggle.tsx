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
	children: React.ReactNode
}> = (props) => {
	const refOuter = React.useRef<HTMLDivElement>(null)
	const refInner = React.useRef<HTMLDivElement>(null)

	const dimensions = React.useRef({
		width: 0,
		height: 0,
		growTime: 0,
	})

	const shrinkDuration = props.shrinkDuration ?? 10 * 1000

	React.useLayoutEffect(() => {
		if (refInner.current && refOuter.current) {
			const { width, height } = refInner.current.getBoundingClientRect()

			if (dimensions.current.width < width || dimensions.current.height < height) {
				// Make larger
				dimensions.current = {
					width: Math.max(dimensions.current.width, width),
					height: Math.max(dimensions.current.height, height),
					growTime: Date.now(),
				}
			} else if (dimensions.current.width === width && dimensions.current.height === height) {
				// Keep size
				dimensions.current.growTime = Date.now()
			} else if (Date.now() - dimensions.current.growTime > shrinkDuration) {
				// Make smaller
				dimensions.current.width = width
				dimensions.current.height = height
			}

			refOuter.current.style.width = dimensions.current.width + 'px'
			refOuter.current.style.height = dimensions.current.height + 'px'
		}
	}, [props.children, shrinkDuration])
	return (
		<div className="anti-wiggle" ref={refOuter}>
			<div className="anti-wiggle__inner" ref={refInner}>
				{props.children}
			</div>
		</div>
	)
}
