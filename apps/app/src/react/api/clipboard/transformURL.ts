/**
 * Do various convenient URL transforms
 */
export function transformURL(url: URL): URL {
	// Youtube video
	// "https://www.youtube.com/watch?v=VIDEO_ID"
	if (url.host.match(/youtube/) && url.pathname.match(/watch/) && url.searchParams.has('v')) {
		// Youtube videos are played the best by using the embed url:
		// https://www.youtube.com/embed/VIDEO_ID?autoplay=true

		const newURL = new URL(url)
		newURL.pathname = `/embed/${newURL.searchParams.get('v')}`
		newURL.searchParams.delete('v')

		// Handle time offset:
		if (newURL.searchParams.has('t')) {
			// on the form "XXmYYs" or "YYs"
			let seconds = 0

			if (!seconds) {
				const m = newURL.searchParams.get('t')?.match(/((\d+)m)?((\d+)s)/)
				if (m) {
					if (m[2]) seconds += parseInt(m[2]) * 60
					seconds += parseInt(m[4])
				}
			}
			if (!seconds) {
				seconds = parseInt(newURL.searchParams.get('t') ?? '0')
			}

			if (seconds) {
				newURL.searchParams.set('start', seconds.toString())
			}
			newURL.searchParams.delete('t')
		}

		// Add some good-to-have parameters:
		// ref: https://developers.google.com/youtube/player_parameters
		newURL.searchParams.set('autoplay', 'true')
		newURL.searchParams.set('loop', '1')
		newURL.searchParams.set('showinfo', '0')
		newURL.searchParams.set('controls', '0')
		newURL.searchParams.set('modestbranding', '1')

		return newURL
	}

	return url
}
