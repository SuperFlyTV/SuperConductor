import React from 'react'
import { Peripheral } from '../../../../../models/project/Peripheral'
import { StreamdeckSettings } from './streamdeck'

export const PeripheralSettings: React.FC<{
	peripheralId: string
	peripheral: Peripheral
}> = ({ peripheralId, peripheral }) => {
	return (
		<div className="peripheral-settings">
			<div>Name: {peripheral.info.name}</div>

			<div className="peripheral-settings__popover__settings">
				{peripheral.info.gui.type === 'streamdeck' && (
					<StreamdeckSettings peripheralId={peripheralId} peripheral={peripheral} />
				)}
				{/* {peripheral.info.gui.type === 'xkeys' && <div>To be implemented </div>} */}
			</div>
		</div>
	)
}
