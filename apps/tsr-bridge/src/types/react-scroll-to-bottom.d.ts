declare module 'react-scroll-to-bottom' {
	import * as React from 'react'

	export interface ReactScrollToBottomProps {
		checkInterval?: number
		className?: string
		debounce?: number
		followButtonClassName?: string
		mode?: string
		scrollViewClassName?: string
		children: React.ReactNode
		debug?: boolean
	}

	export interface ScrollOptions {
		behavior: ScrollBehavior
	}

	export interface FunctionContextProps {
		scrollTo: (scrollTo: number, options: ScrollOptions) => void
		scrollToBottom: (options: ScrollOptions) => void
		scrollToEnd: (options: ScrollOptions) => void
		scrollToStart: (options: ScrollOptions) => void
		scrollToTop: (options: ScrollOptions) => void
	}

	export const FunctionContext: React.Context<FunctionContextProps>

	export default class ReactScrollToBottom extends React.PureComponent<ReactScrollToBottomProps> {}
}
