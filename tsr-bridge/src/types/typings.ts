import { Mappings, TSRTimeline } from "timeline-state-resolver";

export type Optional<T> = {
  [K in keyof T]?: T[K];
};

export type TSRInput = Optional<Input>;

export interface Input {
  settings: TSRSettings;
  devices: {
    [deviceId: string]: any;
  };
  mappings: Mappings;
  timeline: TSRTimeline;
}

export interface TSRSettings {
  initializeAsClear?: boolean;
  multiThreading?: boolean;
  multiThreadedResolver?: boolean;
}
