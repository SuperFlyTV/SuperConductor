import { GDDTypeColorRRGGBBAA } from 'graphics-data-definition'
import React, { useCallback, useEffect, useState } from 'react'
import { PropertyProps } from '../lib.js'
import { EditProperty, WithLabel } from '../util.js'

export const gddTypeColorRRGGBBAA: React.FC<PropertyProps<GDDTypeColorRRGGBBAA>> = (props) => {
	return <RRGGBBAA {...props} />
}
export const RRGGBBAA: React.FC<PropertyProps<GDDTypeColorRRGGBBAA>> = (props) => {
	const [rgbValue, setRgbValue] = useState(props.data || '')
	const [aValue, setAValue] = useState(props.data || '')
	const [rgbaValue, setRgbaValue] = useState(props.data || '')

	const storedValue = props.data || ''
	useEffect(() => {
		let r = 0
		let g = 0
		let b = 0
		let a = 0

		const m = storedValue.match(/(\w\w)(\w\w)(\w\w)(\w\w)/)
		if (m) {
			r = parseInt(m[1], 16)
			g = parseInt(m[2], 16)
			b = parseInt(m[3], 16)
			a = parseInt(m[4], 16)
		} else {
			const m = storedValue.match(/(\w\w)(\w\w)(\w\w)/)
			if (m) {
				r = parseInt(m[1], 16)
				g = parseInt(m[2], 16)
				b = parseInt(m[3], 16)
				a = 255
			}
		}

		const rgbStr =
			'#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0')
		const aStr = a.toString(16).padStart(2, '0')

		setRgbValue(rgbStr)
		setAValue(aStr)
		setRgbaValue(rgbStr + aStr)
	}, [storedValue])

	const setRGB = useCallback(
		(rgb: string) => {
			props.setData(rgb + aValue)
		},
		[props, aValue]
	)
	const setRGBA = useCallback((rgba: string) => {
		setRgbaValue(rgba)
	}, [])
	const saveRGBA = useCallback(() => {
		props.setData(rgbaValue)
		props.onSave()
	}, [props, rgbaValue])

	return (
		<EditProperty className="gdd-edit-data__gddType__string-color-rrggbbaa" {...props}>
			<WithLabel {...props}>
				<input
					type="color"
					value={rgbValue}
					onChange={(e) => {
						setRGB(e.target.value)
					}}
					onBlur={props.onSave}
				/>
				<input
					type="text"
					value={rgbaValue}
					onChange={(e) => {
						setRGBA(e.target.value)
					}}
					onBlur={saveRGBA}
				/>
			</WithLabel>
		</EditProperty>
	)
}
