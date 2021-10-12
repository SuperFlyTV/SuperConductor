import {
  Conductor,
  ConductorOptions,
  DeviceType,
  MappingCasparCG,
} from "timeline-state-resolver";
import { literal } from "timeline-state-resolver/dist/devices/device";
import { timelineMock } from "./mocks/timelineMock";
import { Server } from "./server/server";
import { TSRInput } from "./types/typings";

const allInputs: TSRInput = {
  devices: {
    caspar0: {
      type: DeviceType.CASPARCG,
      options: {
        host: "127.0.0.1",
        port: 5250,
      },
    },
  },
  mappings: {
    casparLayer0: literal<MappingCasparCG>({
      device: DeviceType.CASPARCG,
      deviceId: "caspar0",
      channel: 1,
      layer: 10,
    }),
  },
  settings: {
    multiThreading: true,
    multiThreadedResolver: false,
  },
  timeline: timelineMock,
};

let tsr: Conductor;

let c: ConductorOptions = {
  getCurrentTime: Date.now,
  initializeAsClear: true,
  multiThreadedResolver: false,
  proActiveResolve: true,
};
tsr = new Conductor(c);

tsr.on("error", (e, ...args) => {
  console.error("TSR", e, ...args);
});
tsr.on("info", (msg, ...args) => {
  console.log("TSR", msg, ...args);
});
tsr.on("warning", (msg, ...args) => {
  console.log("Warning: TSR", msg, ...args);
});

tsr.setTimelineAndMappings(allInputs.timeline!, allInputs.mappings);
tsr.addDevice("caspar0", allInputs.devices!.caspar0);

tsr.init();

// Koa

const server = new Server();

console.log("Hello World!");
