import React from 'react'

export const CountDownHead: React.FC<{ timeUntilStart: number }> = ({ timeUntilStart }) => {
	// The time where the countdown should start to show
	const TIME_MAX = 30 * 1000

	const percentage = Math.min(100, (timeUntilStart / TIME_MAX) * 100)

	return (
		<div className="countDownHead">
			{/* {percentage} */}
			{/* <div className="shade" style={{ width: percentage }}></div> */}
			<div className="line" style={{ left: `${percentage}%` }}></div>
		</div>
	)
}
