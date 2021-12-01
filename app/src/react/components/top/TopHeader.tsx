import { Rundown } from '@/models/rundown/Rundown'
import React from 'react'

export const TopHeader: React.FC<{
	rundowns: { rundownId: string; name: string }[]
	onSelect: (rundownId: string) => void
}> = ({ rundowns, onSelect }) => {
	return (
		<>
			{rundowns.map((rundown) => {
				return (
					<div
						key={rundown.rundownId}
						className="tab"
						onClick={() => {
							onSelect(rundown.rundownId)
						}}
					>
						{rundown.name}
					</div>
				)
			})}
		</>
	)
}
