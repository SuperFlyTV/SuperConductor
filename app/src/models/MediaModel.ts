export type MediaModel = {
	name: string
	type: 'image' | 'video'
	size: number
	changed: number
	frames: number
	frameTime: string
	frameRate: number
	duration: number
	thumbnail?: string
}
