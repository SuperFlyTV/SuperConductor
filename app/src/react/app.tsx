import React from 'react'
import Rundowns from './components/rundowns/Rundowns'
import { Sidebar } from './components/sidebar/Sidebar'
import { mediaMock } from '@/mocks/mediaMock'

import './styles/app.scss'

export const App = () => {
	return (
		<div className="app">
			<Rundowns />
			<Sidebar media={mediaMock[0]} />
		</div>
	)
}
