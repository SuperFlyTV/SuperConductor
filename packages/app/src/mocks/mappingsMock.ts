import { literal } from "@/lib";
import { DeviceType, MappingCasparCG, Mappings } from "timeline-state-resolver-types";

const channelId = 1;
const deviceId = "caspar0";

export const mappingsMock: Mappings = {
    casparCGLayer0: literal<MappingCasparCG>({
        device: DeviceType.CASPARCG,
        deviceId: deviceId,
        channel: channelId,
        layer: 0,
    }),
    casparCGLayer1: literal<MappingCasparCG>({
        device: DeviceType.CASPARCG,
        deviceId: deviceId,
        channel: channelId,
        layer: 1,
    }),
    casparCGLayer2: literal<MappingCasparCG>({
        device: DeviceType.CASPARCG,
        deviceId: deviceId,
        channel: channelId,
        layer: 2,
    }),
    casparCGLayer3: literal<MappingCasparCG>({
        device: DeviceType.CASPARCG,
        deviceId: deviceId,
        channel: channelId,
        layer: 3,
    }),
    casparCGLayer4: literal<MappingCasparCG>({
        device: DeviceType.CASPARCG,
        deviceId: deviceId,
        channel: channelId,
        layer: 4,
    }),
    casparCGLayer5: literal<MappingCasparCG>({
        device: DeviceType.CASPARCG,
        deviceId: deviceId,
        channel: channelId,
        layer: 5,
    }),
}
