import { TSRTimeline } from "timeline-state-resolver";
import {
  DeviceType,
  TimelineContentTypeCasparCg,
} from "timeline-state-resolver-types";

export const timelineMock: TSRTimeline = [
  {
    id: "video0",
    layer: "casparLayer0",
    enable: {
      start: Date.now(),
      duration: 5 * 1000,
    },
    content: {
      deviceType: DeviceType.CASPARCG,
      type: TimelineContentTypeCasparCg.MEDIA,
      file: "bbb_trailer",
    },
  },
];
