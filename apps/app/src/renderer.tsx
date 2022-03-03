import React, { useMemo } from 'react'
import ReactDOM from 'react-dom'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { SnackbarProvider } from 'notistack'
import { createTheme, CssBaseline, ThemeProvider } from '@mui/material'
import { App } from './react/App'

const SMALL_BTN_SIZE = '18px'

export const ContextWrapper: React.FC = () => {
	const theme = useMemo(() => {
		return createTheme({
			palette: {
				mode: 'dark',
				// primary: {
				// 	main: '#545A78',
				// },
			},
			typography: {
				fontFamily: ['Barlow', 'sans-serif'].join(','),
				/**
				 * This is needed to counteract the `font-size: 62.5%` style on the <html> tag.
				 * See https://mui.com/customization/typography/#font-size for more details.
				 */
				fontSize: 14 * 1.6,
			},
			components: {
				MuiCssBaseline: {
					styleOverrides: {
						'*, *::before, *::after': {
							transition: 'none !important',
							animation: 'none !important',
						},
					},
				},
				MuiButtonBase: {
					defaultProps: {
						disableRipple: true,
					},
				},
				MuiButton: {
					styleOverrides: {
						sizeSmall: {
							padding: 0,
							minWidth: 0,
							width: SMALL_BTN_SIZE,
							height: SMALL_BTN_SIZE,
						},
						containedPrimary: {
							color: 'white',
							backgroundColor: '#545A78',
							'&:hover': {
								backgroundColor: '#3a3e54',
							},
						},
					},
				},
				MuiButtonGroup: {
					styleOverrides: {
						grouped: {
							minWidth: 0,
						},
					},
				},
				MuiToggleButton: {
					styleOverrides: {
						root: {
							'&.Mui-selected': {
								backgroundColor: '#2EFF43',
								'&:hover': {
									background: '#2EFF43',
								},
							},
						},
						sizeSmall: {
							padding: 0,
							width: SMALL_BTN_SIZE,
							height: SMALL_BTN_SIZE,
						},
					},
				},
			},
		})
	}, [])

	return (
		<DndProvider backend={HTML5Backend}>
			<ThemeProvider theme={theme}>
				<SnackbarProvider maxSnack={1}>
					<CssBaseline />
					<App />
				</SnackbarProvider>
			</ThemeProvider>
		</DndProvider>
	)
}

ReactDOM.render(<ContextWrapper />, document.getElementById('root'))
