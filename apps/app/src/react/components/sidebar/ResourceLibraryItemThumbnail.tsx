import React from 'react'
import { FaFile, FaFileAudio, FaFileVideo } from 'react-icons/fa'
import { CasparCGMedia } from '@shared/models'

export const ResourceLibraryItemThumbnail: React.FC<{ resource: CasparCGMedia }> = (props) => {
	const { resource } = props

	if (resource.thumbnail) {
		return <img className="thumbnail" src={resource.thumbnail} alt={resource.name} />
	}

	if (resource.type === 'video' && !resource.thumbnail) {
		return <FaFileVideo className="thumbnail thumbnail--video-fallback" />
	}

	if (resource.type === 'audio') {
		return <FaFileAudio className="thumbnail thumbnail--audio" />
	}

	return <FaFile className="thumbnail thumbnail--unknown" />
}
