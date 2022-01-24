import React from 'react'

export const BooleanInput: React.FC<{ currentValue: boolean | undefined; onChange: (newValue: boolean) => void }> = ({
	currentValue,
	onChange,
}) => {
	return (
		<input
			type="checkbox"
			onChange={(e) => {
				onChange(e.target.checked)
			}}
			checked={!!currentValue}
		/>
	)
}
