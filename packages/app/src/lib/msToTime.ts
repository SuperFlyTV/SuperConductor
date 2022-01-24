export const msToTime = (duration: number) => {
	const milliseconds: number | string = Math.floor((duration % 1000) / 100)
	let seconds: number | string = Math.floor((duration / 1000) % 60)
	let minutes: number | string = Math.floor((duration / (1000 * 60)) % 60)
	// const hours: number | string = Math.floor((duration / (1000 * 60 * 60)) % 24)

	// hours = hours < 10 ? '0' + hours : hours
	minutes = minutes.toString().padStart(2, '0')
	seconds = seconds.toString().padStart(2, '0')

	// return hours + ':' + minutes + ':' + seconds + '.' + milliseconds
	return minutes + ':' + seconds + '.' + milliseconds
}
