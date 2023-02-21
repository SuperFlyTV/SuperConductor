import React, { useEffect, useState } from 'react'

export function DebugTestErrors(): JSX.Element {
	const els: JSX.Element[] = []

	for (let i = 0; i < 10; i++) {
		// These elements are missing a "key"-prop, which should trigger a React warning
		els.push(<div>A</div>)
	}

	const [wait, setWait] = useState(false)
	useEffect(() => {
		setTimeout(() => {
			setWait(true)
		}, 200)
	}, [])

	useEffect(() => {
		if (wait) {
			throw new Error('This is a client error thrown in a React component')
		}
	}, [wait])

	return <>{els}</>
}
