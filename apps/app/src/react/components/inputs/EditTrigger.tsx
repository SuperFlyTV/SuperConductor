import { Button, ButtonGroup } from '@mui/material'

import React, { useState } from 'react'

import { Trigger } from '../../../models/rundown/Trigger'
import { BsTrash, BsFillPlayFill, BsStopFill } from 'react-icons/bs'

export const EditTrigger: React.FC<{
	trigger: Trigger
	index: number
	onEdit: (index: number, trigger: Trigger | null) => void
}> = ({ trigger, index, onEdit }) => {
	const [editing, setEditing] = useState<boolean>(false)

	const label = (
		<div className="label">
			<a
				className=""
				onClick={() => {
					setEditing((editing) => !editing)
				}}
			>
				{trigger.action === 'play' ? (
					<BsFillPlayFill size={14} />
				) : trigger.action === 'stop' ? (
					<BsStopFill size={14} />
				) : trigger.action === 'playStop' ? (
					<>
						<BsFillPlayFill size={14} />
						<BsStopFill size={14} />
					</>
				) : null}
				{trigger.label}
			</a>
		</div>
	)

	if (editing) {
		return (
			<div className="trigger trigger-open">
				{label}

				<div className="trigger__buttons">
					<Button
						className="btn btn--small"
						variant="contained"
						onClick={() => {
							onEdit(index, null)
						}}
						color="error"
						title="Delete Trigger"
					>
						<BsTrash size={14} />
					</Button>

					<ButtonGroup className="trigger__buttons__triggerType">
						<Button
							className="btn btn--small"
							variant="contained"
							onClick={() => {
								onEdit(index, { ...trigger, action: 'play' })
							}}
							color={trigger.action === 'play' ? 'primary' : 'inherit'}
							title="Trigger Play"
						>
							<BsFillPlayFill size={14} />
						</Button>
						<Button
							className="btn btn--small"
							variant="contained"
							onClick={() => {
								onEdit(index, { ...trigger, action: 'stop' })
							}}
							color={trigger.action === 'stop' ? 'primary' : 'inherit'}
							title="Trigger Stop"
						>
							<BsStopFill size={14} />
						</Button>
						<Button
							className="btn btn--small"
							variant="contained"
							onClick={() => {
								onEdit(index, { ...trigger, action: 'playStop' })
							}}
							color={trigger.action === 'playStop' ? 'primary' : 'inherit'}
							title="Trigger Toggle Play/Stop"
						>
							<BsFillPlayFill size={14} />
							<BsStopFill size={14} />
						</Button>
					</ButtonGroup>

					{/* <Button variant="contained" color="primary" className={classNames('btn', 'btn--small')} onClick={}>

					 </Button> */}
					{/* <Button variant="contained" color="primary" className={classNames('btn', 'btn--small')} onClick={handleOnClick}>
			 	{props.active ? <BsKeyboardFill color="white" size={24} /> : <BsKeyboard color="white" size={24} />}
			</Button> */}
				</div>
			</div>
		)
	} else {
		return <div className="trigger">{label}</div>
	}
}
