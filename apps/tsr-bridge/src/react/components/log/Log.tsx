import React from 'react'
import ScrollToBottom from 'react-scroll-to-bottom'

export const Log: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	return <ScrollToBottom className="log">{children}</ScrollToBottom>
}
