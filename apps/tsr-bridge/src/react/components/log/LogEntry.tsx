import React from 'react'
import { LogEntry as LogEntryType } from 'winston'
import classNames from 'classnames'

export const LogEntry: React.FC<{ entry: LogEntryType }> = ({ entry }) => {
	return (
		<div className="logEntry">
			[
			<span
				className={classNames('logEntry__level', {
					[entry.level]: true,
				})}
			>
				{entry.level}
			</span>
			]: {entry.message}
		</div>
	)
}
