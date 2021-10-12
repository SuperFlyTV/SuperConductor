export type MediaModel = {
	filename: string
	type: 'STILL' | 'MOVIE' | 'AUDIO'
	filesize: number
	lastModified: number
	frameCount: number
	frameRateDuration: string
}
