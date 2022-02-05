import React from 'react'

export const ErrorHandlerContext = React.createContext<{ handleError: (error: unknown) => void }>({
	handleError: (error) => {
		console.error(error)
	},
})
