import React from 'react'

export const ErrorHandlerContext = React.createContext<{ handleError: (error: unknown) => void }>({
	handleError: (error) => {
		// Note: this is never-used default, as it is overridden in App.tsx
		// eslint-disable-next-line no-console
		console.error(error)
	},
})
