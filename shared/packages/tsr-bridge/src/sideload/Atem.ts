import { DeviceOptionsAtem } from 'timeline-state-resolver'
import { Atem, AtemConnectionStatus } from 'atem-connection'
import {
	ResourceAny,
	ResourceType,
	AtemMe,
	AtemDsk,
	AtemAudioChannel,
	AtemAux,
	AtemMacroPlayer,
	AtemMediaPlayer,
	AtemSsrc,
	AtemSsrcProps,
	ResourceId,
} from '@shared/models'
import { SideLoadDevice } from './sideload'
import { LoggerLike } from '@shared/api'
import { generateResourceId } from '@shared/lib'

export class AtemSideload implements SideLoadDevice {
	private atem: Atem
	/** A cache of resources to be used when the device is offline. */
	private cacheResources: Map<ResourceId, ResourceAny> = new Map()

	constructor(private deviceId: string, private deviceOptions: DeviceOptionsAtem, private log: LoggerLike) {
		this.atem = new Atem()

		this.atem.on('connected', () => {
			this.log.info(`ATEM ${deviceId}: Sideload connection initialized`)
		})

		this.atem.on('disconnected', () => {
			this.log.info(`ATEM ${deviceId}: Sideload connection disconnected`)
		})

		if (deviceOptions.options?.host) {
			this.atem.connect(deviceOptions.options.host, deviceOptions.options?.port).catch(log.error)
		}
	}
	public async refreshResources(): Promise<ResourceAny[]> {
		return this._refreshResources()
	}
	async close(): Promise<void> {
		return this.atem.destroy()
	}
	private async _refreshResources() {
		const resources: Map<ResourceId, ResourceAny> = new Map()

		if (this.atem.status !== AtemConnectionStatus.CONNECTED || !this.atem.state) {
			return Array.from(this.cacheResources.values())
		}

		for (const me of this.atem.state.video.mixEffects) {
			if (!me) {
				continue
			}
			const resource: AtemMe = {
				resourceType: ResourceType.ATEM_ME,
				deviceId: this.deviceId,
				id: generateResourceId(this.deviceId, ResourceType.ATEM_ME, me.index),
				index: me.index,
				displayName: `ATEM ME ${me.index + 1}`,
			}
			resources.set(resource.id, resource)
		}

		for (let i = 0; i < this.atem.state.video.downstreamKeyers.length; i++) {
			const dsk = this.atem.state.video.downstreamKeyers[i]
			if (!dsk) {
				continue
			}

			const resource: AtemDsk = {
				resourceType: ResourceType.ATEM_DSK,
				deviceId: this.deviceId,
				id: generateResourceId(this.deviceId, ResourceType.ATEM_DSK, i),
				index: i,
				displayName: `ATEM DSK ${i + 1}`,
			}
			resources.set(resource.id, resource)
		}

		for (let i = 0; i < this.atem.state.video.auxilliaries.length; i++) {
			const aux = this.atem.state.video.auxilliaries[i]
			if (typeof aux === 'undefined') {
				continue
			}

			const resource: AtemAux = {
				resourceType: ResourceType.ATEM_AUX,
				deviceId: this.deviceId,
				id: generateResourceId(this.deviceId, ResourceType.ATEM_AUX, i),
				index: i,
				displayName: `ATEM AUX ${i + 1}`,
			}
			resources.set(resource.id, resource)
		}

		for (let i = 0; i < this.atem.state.video.superSources.length; i++) {
			const ssrc = this.atem.state.video.superSources[i]
			if (!ssrc) {
				continue
			}

			{
				const resource: AtemSsrc = {
					resourceType: ResourceType.ATEM_SSRC,
					deviceId: this.deviceId,
					id: generateResourceId(this.deviceId, ResourceType.ATEM_SSRC, i),
					index: i,
					displayName: `ATEM SuperSource ${i + 1}`,
				}
				resources.set(resource.id, resource)
			}

			{
				const resource: AtemSsrcProps = {
					resourceType: ResourceType.ATEM_SSRC_PROPS,
					deviceId: this.deviceId,
					id: generateResourceId(this.deviceId, ResourceType.ATEM_SSRC_PROPS, i),
					index: i,
					displayName: `ATEM SuperSource ${i + 1} Props`,
				}
				resources.set(resource.id, resource)
			}
		}

		if (this.atem.state.macro.macroPlayer) {
			const resource: AtemMacroPlayer = {
				resourceType: ResourceType.ATEM_MACRO_PLAYER,
				deviceId: this.deviceId,
				id: generateResourceId(this.deviceId, ResourceType.ATEM_MACRO_PLAYER, 0),
				displayName: 'ATEM Macro Player',
			}
			resources.set(resource.id, resource)
		}

		if (this.atem.state.fairlight) {
			for (const inputNumber in this.atem.state.fairlight.inputs) {
				const input = this.atem.state.fairlight.inputs[inputNumber]
				if (!input) {
					continue
				}

				const resource: AtemAudioChannel = {
					resourceType: ResourceType.ATEM_AUDIO_CHANNEL,
					deviceId: this.deviceId,
					id: generateResourceId(this.deviceId, ResourceType.ATEM_AUDIO_CHANNEL, inputNumber),
					index: parseInt(inputNumber, 10),
					displayName: `ATEM Audio Channel ${inputNumber}`,
				}
				resources.set(resource.id, resource)
			}
		} else if (this.atem.state.audio) {
			for (const channelNumber in this.atem.state.audio.channels) {
				const channel = this.atem.state.audio.channels[channelNumber]
				if (!channel) {
					continue
				}

				const resource: AtemAudioChannel = {
					resourceType: ResourceType.ATEM_AUDIO_CHANNEL,
					deviceId: this.deviceId,
					id: generateResourceId(this.deviceId, ResourceType.ATEM_AUDIO_CHANNEL, channelNumber),
					index: parseInt(channelNumber, 10),
					displayName: `ATEM Audio Channel ${channelNumber}`,
				}
				resources.set(resource.id, resource)
			}
		}

		for (let i = 0; i < this.atem.state.media.players.length; i++) {
			const mp = this.atem.state.media.players[i]
			if (!mp) {
				continue
			}

			const resource: AtemMediaPlayer = {
				resourceType: ResourceType.ATEM_MEDIA_PLAYER,
				deviceId: this.deviceId,
				id: generateResourceId(this.deviceId, ResourceType.ATEM_MEDIA_PLAYER, i),
				index: i,
				displayName: `ATEM Media Player ${i + 1}`,
			}
			resources.set(resource.id, resource)
		}

		this.cacheResources = resources
		return Array.from(resources.values())
	}
}
