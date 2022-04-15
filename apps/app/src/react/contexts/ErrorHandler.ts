import React from 'react'

export const ErrorHandlerContext = React.createContext<{ handleError: (error: unknown) => void }>({
	handleError: (error) => {
		// eslint-disable-next-line no-console
		console.error(error)
	},
})
