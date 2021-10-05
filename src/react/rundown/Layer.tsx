import React from 'react'
type PropsType = {}

export const Layer = () => {
	const start = 50
	const duration = 200

	return (
		<div className="layer">
			<div className="layer__content" style={{ width: duration, left: start }}>
				<div className="title">main-clip</div>
			</div>
		</div>
	)
}
