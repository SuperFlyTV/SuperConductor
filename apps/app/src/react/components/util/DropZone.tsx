import classNames from 'classnames'
import React from 'react'

interface IDropZoneProps extends React.HTMLAttributes<HTMLDivElement> {
	isOver?: boolean
	label?: string
}

export const DropZone = React.forwardRef<HTMLDivElement, IDropZoneProps>(function DropZone(
	{ isOver, label, children, className, ...restProps },
	ref
) {
	return (
		<div ref={ref} className={classNames('drop-zone', className, { 'drop-zone--isOver': isOver })} {...restProps}>
			{children}
			<div className="drop-zone__outline">{label}</div>
		</div>
	)
})
