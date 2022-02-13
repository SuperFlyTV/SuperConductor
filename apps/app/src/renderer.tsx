import React, { useMemo } from 'react'
import ReactDOM from 'react-dom'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { SnackbarProvider } from 'notistack'
import { createTheme, ThemeProvider } from '@mui/material'
import { App } from './react/App'

export const ContextWrapper: React.FC = () => {
	const theme = useMemo(() => {
		return createTheme({
			palette: {
				mode: 'dark',
				primary: {
					main: '#e96703',
				},
			},
			typography: {
				/**
				 * This is needed to counteract the `font-size: 62.5%` style on the <html> tag.
				 * See https://mui.com/customization/typography/#font-size for more details.
				 */
				fontSize: 14 * 1.6,
			},
		})
	}, [])

	return (
		<DndProvider backend={HTML5Backend}>
			<ThemeProvider theme={theme}>
				<SnackbarProvider maxSnack={1}>
					<App />
				</SnackbarProvider>
			</ThemeProvider>
		</DndProvider>
	)
}

ReactDOM.render(<ContextWrapper />, document.getElementById('root'))
