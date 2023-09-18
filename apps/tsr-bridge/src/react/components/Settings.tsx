import React, { useContext, useEffect } from 'react'
import Toggle from 'react-toggle'
import { TextField } from '@mui/material'
import { AppSettings, AppSystem } from '../../models/AppData'
import { IPCServerContext } from '../contexts/IPCServer'
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md'
import classNames from 'classnames'
import { protectString } from '@shared/models'

function logError(...args: any[]): void {
	// eslint-disable-next-line no-console
	console.error(...args)
}

export const Settings: React.FC<{
	settings: AppSettings
	system: AppSystem
}> = ({ settings, system }) => {
	const ipcServer = useContext(IPCServerContext)

	const [superConductorHost, setSuperConductorHost] = React.useState(settings.superConductorHost)
	const [bridgeId, setBridgeId] = React.useState(settings.bridgeId)
	const [listenPort, setListenPort] = React.useState(`${settings.listenPort}`)
	useEffect(() => {
		setSuperConductorHost(settings.superConductorHost)
		setBridgeId(settings.bridgeId)
		setListenPort(`${settings.listenPort}`)
	}, [settings])

	const updateSettings = (partialSettings: Partial<AppSettings>) => {
		ipcServer.updateSettings(partialSettings).catch(logError)
	}

	return (
		<div
			className={classNames(`settings`, {
				closed: !settings.guiSettingsOpen,
			})}
		>
			<a
				className="open-close-handle"
				onClick={() => {
					ipcServer
						.updateSettings({
							guiSettingsOpen: !settings.guiSettingsOpen,
						})
						.catch(logError)
				}}
			>
				{settings.guiSettingsOpen ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
			</a>
			<div className="content">
				<div className="setting">
					<div className="label">Autostart on system startup</div>
					<div className="value">
						<div className="sc-switch">
							<Toggle
								defaultChecked={settings.autostart}
								onChange={() =>
									updateSettings({
										autostart: !settings.autostart,
									})
								}
							/>
						</div>
					</div>
				</div>
				<div className="setting">
					<div className="label">Mode select: Client / Server</div>
					<div className="value">
						<div className="sc-switch">
							<Toggle
								defaultChecked={settings.acceptConnections}
								onChange={() =>
									updateSettings({
										acceptConnections: !settings.acceptConnections,
									})
								}
							/>
						</div>
					</div>
				</div>

				{settings.acceptConnections ? (
					<>
						<div className="header">TSR-Bridge is in server mode</div>
						<div className="description">
							<p>
								SuperConductor can connect to this TSR-Bridge, by adding this bridge to{' '}
								<i>&quot;Outgoing Bridges&quot;</i> in the SuperConductor settings.
								<br />
							</p>
							<p>
								<b>Local addresses of this TSR-Bridge:</b>
							</p>
							<ul>
								{system.networkAddresses.map((address, index) => (
									<li key={index}>{`ws://${address}:${listenPort}`}</li>
								))}
							</ul>
						</div>
						<div className="setting">
							<div className="label">Port number</div>
							<div className="value">
								<TextField
									margin="normal"
									size="small"
									type="text"
									label="Port number"
									value={listenPort}
									sx={{ marginRight: '0.5rem' }}
									onChange={(event) => setListenPort(event.target.value)}
									onBlur={() => updateSettings({ listenPort: parseInt(listenPort) || 5401 })}
								/>
							</div>
						</div>
					</>
				) : (
					<>
						<div className="header">TSR-Bridge is in client mode</div>
						<div className="description">
							<p>
								Enter the address of the SuperConductor below to connect to it. It will show up as an{' '}
								<i>&quot;Incoming Bridge&quot;</i> in the SuperConductor settings.
								<br />
							</p>
						</div>
						<div className="setting">
							<div className="label">ID of this bridge</div>
							<div className="value">
								<TextField
									margin="normal"
									size="small"
									type="text"
									label="Bridge ID"
									value={bridgeId}
									sx={{ marginRight: '0.5rem' }}
									onChange={(event) => setBridgeId(protectString(event.target.value))}
									onBlur={() => updateSettings({ bridgeId })}
								/>
							</div>
						</div>
						<div className="setting">
							<div className="label">Host name of SuperConductor</div>
							<div className="value">
								<TextField
									margin="normal"
									size="small"
									type="text"
									label="Host Name"
									value={superConductorHost}
									sx={{ marginRight: '0.5rem' }}
									onChange={(event) => setSuperConductorHost(event.target.value)}
									onBlur={() => updateSettings({ superConductorHost })}
								/>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	)
}
