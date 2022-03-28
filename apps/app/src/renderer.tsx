import React, { useMemo } from 'react'
import ReactDOM from 'react-dom'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { SnackbarProvider } from 'notistack'
import { createTheme, CssBaseline, ThemeProvider } from '@mui/material'
import { App } from './react/App'

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
				MuiFormControlLabel: {
					styleOverrides: {
						root: {
							background: 'rgba(0, 0, 0, 0.33)',
							borderRadius: '100px',
							paddingLeft: '1.3rem',
						},
					},
				},
				MuiSwitch: {
					defaultProps: {
						disableRipple: true,
					},
					styleOverrides: {
						switchBase: {
							'&:hover': {
								backgroundColor: 'transparent',
							},
							'&.Mui-checked': {
								'&:hover': {
									backgroundColor: 'transparent',
								},
							},
						},
						thumb: {
							width: '14px',
							height: '14px',
							top: '3px',
							left: '3px',
							position: 'relative',
						},
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
							opacity: 0.1,
							'&.Mui-selected': {
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

ReactDOM.render(<ContextWrapper />, document.getElementById('root'))
