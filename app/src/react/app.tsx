import React from 'react'
import Rundowns from './components/rundowns/Rundowns'
import { Sidebar } from './components/sidebar/Sidebar'
import './app.scss'
import { mediaMock } from '@/mocks/mediaMock'

export const App = () => {
	return (
		<div className="app">
			<Rundowns />
			<Sidebar media={mediaMock[0]} />
		</div>
	)
}
