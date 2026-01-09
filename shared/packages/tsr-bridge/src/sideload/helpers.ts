// Helpers for parsing CasparCG framerates and calculating durations
export function parseCasparFramerate(raw: number | undefined | null): number {
	if (raw == null || typeof raw !== 'number' || !isFinite(raw) || raw <= 0) return 0

	// If value looks already like FPS (20-70), return it directly
	if (raw >= 20 && raw <= 70) return raw

	// If encoded as fps*1000 or fps*1001, try decoding
	if (raw > 1000) {
		const by1000 = raw / 1000
		const by1001 = raw / 1001

		// Known fractional NTSC rates
		const ntsc29 = 29.97
		const ntsc59 = 59.94
		const eps = 0.05

		// Prefer the candidate closest to known NTSC rates
		if (Math.abs(by1001 - ntsc29) < eps || Math.abs(by1001 - ntsc59) < eps) {
			return by1001
		}

		// Otherwise choose the candidate that's in a plausible FPS range
		if (by1000 >= 20 && by1000 <= 70) return by1000
		if (by1001 >= 20 && by1001 <= 70) return by1001

		// Fallback to by1000
		return by1000
	}

	// Otherwise, fallback to raw (may be unusual)
	return raw
}

export function durationFromFrames(frames: number | undefined | null, rawFramerate: number | undefined | null): number {
	if (frames == null || rawFramerate == null) return 0
	const fps = parseCasparFramerate(rawFramerate)
	if (!(fps > 0)) return 0
	const duration = frames / fps
	if (!isFinite(duration) || duration < 0 || duration > 86400) return 0
	return duration
}

export function frameTimeFromFrames(
	framesTotal: number | undefined | null,
	rawFramerate: number | undefined | null
): string {
	if (framesTotal == null || rawFramerate == null) return ''
	const fps = Math.round(parseCasparFramerate(rawFramerate))
	if (!(fps > 0)) return ''

	const totalFrames = framesTotal
	const frames = totalFrames % fps
	const totalSeconds = Math.floor(totalFrames / fps)
	const hours = Math.floor(totalSeconds / 3600)
	const minutes = Math.floor((totalSeconds % 3600) / 60)
	const seconds = totalSeconds % 60

	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(frames).padStart(2, '0')}`
}
