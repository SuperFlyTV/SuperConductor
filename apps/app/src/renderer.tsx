import React, { useMemo } from 'react'
import ReactDOM from 'react-dom/client'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { SnackbarProvider } from 'notistack'
import { createTheme, CssBaseline, ThemeProvider } from '@mui/material'
import { App } from './react/App.js'

const SMALL_BTN_SIZE = '22px'

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
						// '*, *::before, *::after': {
						// 	transition: 'none !important',
						// 	animation: 'none !important',
						// },
					},
				},
				MuiButtonBase: {
					defaultProps: {
						disableRipple: true,
					},
				},
				MuiButton: {
					styleOverrides: {
						root: {
							'&.Mui-disabled': {
								/** Used to make "title" tooltips appear on disabled buttons */
								pointerEvents: 'auto',
								'&:hover': {
									backgroundColor: 'rgba(255, 255, 255, 0.12)',
								},
							},
						},
						sizeSmall: {
							padding: '0 2px',
							minWidth: SMALL_BTN_SIZE,
							height: SMALL_BTN_SIZE,
						},
						containedPrimary: {
							color: 'white',
							backgroundColor: '#545A78',
							'&:hover': {
								backgroundColor: '#3a3e54',
							},
						},
						colorInherit: {
							color: '#ccc',
							backgroundColor: '#666',
							'&:hover': {
								backgroundColor: '#999',
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
				MuiSwitch: {
					defaultProps: {
						disableRipple: true,
					},
				},
				MuiToggleButton: {
					styleOverrides: {
						root: {
							'&.Mui-disabled': {
								/** Used to make "title" tooltips appear on disabled buttons */
								pointerEvents: 'auto',
							},
						},
						sizeSmall: {
							padding: 0,
							width: SMALL_BTN_SIZE,
							height: SMALL_BTN_SIZE,
							border: 'none',
							background: 'none',
							opacity: 0.3,
							'&.Mui-selected': {
								border: '1px solid rgba(255, 255, 255, 0.12)',
								background: 'none',
								filter: 'drop-shadow(0px 0px 4px rgba(255, 255, 0, 0.25))',
								opacity: 1,
								visibility: 'visible !important',
								'&:hover': {
									background: 'none',
								},
							},
							'&.Mui-disabled': {
								border: 'none',
								visibility: 'hidden',
							},
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
const container = document.getElementById('root')
if (!container) throw new Error('root element not found!')
const root = ReactDOM.createRoot(container)
root.render(<ContextWrapper />)
