import * as React from 'react'

interface IState {
	hasError: boolean
	error?: Error
	info?: React.ErrorInfo
	expandedStack?: boolean
	expandedComponentStack?: boolean
}

export class ErrorBoundary extends React.Component<
	{
		children: React.ReactNode
	},
	IState
> {
	static style = {
		box: {
			display: 'block',
			position: 'static',
			margin: '0',
			padding: '10px',
			fontSize: '10px',
			lineHeight: '1.2em',
			fontFamily: 'Roboto, sans-serif',
			fontWeight: 300,
			width: '100%',
			height: 'auto',
			overflow: 'visible',
			background: 'white',
			textDecoration: 'none',
			color: 'red',
			border: '1px solid red',
		} as React.CSSProperties,
		header: {
			display: 'block',
			position: 'static',
			margin: '0 0 10px 0',
			padding: '0',
			fontSize: '14px',
			lineHeight: '1.2em',
			fontFamily: 'Roboto, sans-serif',
			fontWeight: 600,
			width: '100%',
			height: 'auto',
			overflow: 'visible',
			background: 'none',
			textDecoration: 'none',
			color: 'red',
			border: 'none',
		} as React.CSSProperties,
		message: {
			display: 'block',
			position: 'static',
			margin: '0 0 10px 0',
			padding: '0',
			fontSize: '10px',
			lineHeight: '1.2em',
			fontFamily: 'Roboto, sans-serif',
			fontWeight: 300,
			width: '100%',
			height: 'auto',
			overflow: 'visible',
			background: 'white',
			textDecoration: 'none',
			color: 'red',
			border: 'none',
		} as React.CSSProperties,
		stack: {
			display: 'block',
			position: 'static',
			margin: '0 0 10px 0',
			padding: '0',
			fontSize: '10px',
			lineHeight: '1.2em',
			fontFamily: 'Roboto, sans-serif',
			fontWeight: 300,
			width: '100%',
			height: 'auto',
			overflow: 'hidden',
			textOverflow: 'ellipsis',
			background: 'none',
			textDecoration: 'none',
			color: 'red',
			border: 'none',
			cursor: 'pointer',
			whiteSpace: 'nowrap',
		} as React.CSSProperties,
		componentStack: {
			display: 'block',
			position: 'static',
			margin: '0 0 10px 0',
			padding: '0',
			fontSize: '10px',
			lineHeight: '1.2em',
			fontFamily: 'Roboto, sans-serif',
			fontWeight: 300,
			width: '100%',
			height: 'auto',
			overflow: 'hidden',
			textOverflow: 'ellipsis',
			background: 'none',
			textDecoration: 'none',
			color: 'red',
			border: 'none',
			cursor: 'pointer',
			whiteSpace: 'nowrap',
		} as React.CSSProperties,
		expandedStack: {
			whiteSpace: 'pre',
		} as React.CSSProperties,
		resetButton: {
			display: 'block',
			position: 'static',
			margin: '0 0 0 0',
			padding: '0',
			fontSize: '10px',
			lineHeight: '1.2em',
			fontFamily: 'Roboto, sans-serif',
			fontWeight: 600,
			width: '100%',
			height: 'auto',
			overflow: 'visible',
			background: 'white',
			textDecoration: 'underline',
			color: 'red',
			border: 'none',
			cursor: 'pointer',
		} as React.CSSProperties,
		link: {
			display: 'block',
			position: 'static',
			margin: '0 0 0 0',
			padding: '0',
			fontSize: '14px',
			lineHeight: '1.2em',
			fontFamily: 'Roboto, sans-serif',
			fontWeight: 600,
			fontStyle: 'italic',
			width: '100%',
			height: 'auto',
			overflow: 'visible',
			background: 'white',
			textDecoration: 'underline',
			color: 'red',
			border: 'none',
			cursor: 'pointer',
			backgroundColor: '#fdd',
		} as React.CSSProperties,
	}

	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	constructor(props: any) {
		super(props)
		this.state = {
			hasError: false,
		}
	}

	componentDidCatch(error: Error, info: React.ErrorInfo): void {
		this.setState({
			hasError: true,
			error: error,
			info: info,
		})
		// @ts-expect-error hack
		if (window.handleError) {
			// @ts-expect-error hack
			window.handleError({
				message: 'React error: ' + error.message,
				stack: `${error.stack} ${info.componentStack}`,
			})
		} else {
			// eslint-disable-next-line no-console
			console.error(error, info)
		}
	}

	toggleComponentStack = (): void => {
		this.setState({ expandedComponentStack: !this.state.expandedComponentStack })
	}

	toggleStack = (): void => {
		this.setState({ expandedStack: !this.state.expandedStack })
	}

	resetComponent = (): void => {
		this.setState({ hasError: false })
	}

	render(): JSX.Element | React.ReactFragment | number | string | true | null {
		if (this.state.hasError) {
			const errorString = [
				this.state.error?.name,
				this.state.info?.componentStack,
				this.state.error?.message,
				this.state.error?.stack,
			].join('\n')

			return (
				<div style={ErrorBoundary.style.box}>
					{this.state.error && (
						<React.Fragment>
							<h5 style={ErrorBoundary.style.header}>Something went wrong!</h5>
							<p>
								<a
									style={ErrorBoundary.style.link}
									href={`https://github.com/SuperFlyTV/SuperConductor/issues/new?labels=bug&template=bug_report.md&title=Error+in+GUI&body=${encodeURIComponent(
										'**To Reproduce**\nSteps to reproduce the behavior:\n\n\n\n\n\n**The Error**\n' +
											errorString
									)}`}
									target="_blank"
									rel="noreferrer"
								>
									Please click here to go to GitHub and report the bug!
								</a>
							</p>
							{this.state.info && (
								<p
									style={{
										...ErrorBoundary.style.componentStack,
										...(this.state.expandedComponentStack ? ErrorBoundary.style.expandedStack : {}),
									}}
									onClick={this.toggleComponentStack}
								>
									<b>{this.state.error.name}</b> {this.state.info.componentStack}
								</p>
							)}
							<p style={ErrorBoundary.style.message}>{this.state.error.message}</p>
							{this.state.error.stack && (
								<p
									style={{
										...ErrorBoundary.style.stack,
										...(this.state.expandedStack ? ErrorBoundary.style.expandedStack : {}),
									}}
									onClick={this.toggleStack}
								>
									{this.state.error.stack}
								</p>
							)}
						</React.Fragment>
					)}
					<div style={ErrorBoundary.style.resetButton} onClick={this.resetComponent}>
						Click here to try to restart the component
					</div>
				</div>
			)
		}
		return this.props.children || null
	}
}
