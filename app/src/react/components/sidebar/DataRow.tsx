import React from 'react'

export const DataRow = (props: { label: string; value: any }) => {
	return (
		<div className="row">
			<div className="label">{props.label}</div>
			<div className="value">{props.value}</div>
		</div>
	)
}

export const FormRow = (props: { children: React.ReactNode }) => {
	return <div className="row">{props.children}</div>
}
