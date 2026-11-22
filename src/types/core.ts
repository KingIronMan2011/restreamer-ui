export type FFmpegOption = string | number;

export type FFmpegMapping = {
  global: unknown[];
  local: FFmpegOption[];
  filter: string[];
};

export type CoreInput = {
  address: string;
  options: FFmpegOption[];
};

export type CoreStream = {
  index: number;
  stream: number;
  type: string;
  codec?: string;
  width?: number;
  height?: number;
  sampling_hz?: number;
  layout?: string;
  channels?: number;
};

export type CoreSource = {
  inputs: CoreInput[];
  streams: CoreStream[];
};

export type CoreCoderProfile = {
  coder: string;
  settings: Record<string, unknown>;
  mapping: FFmpegMapping;
};

export type CoreMediaProfile = {
  source: number;
  stream: number;
  encoder: CoreCoderProfile;
  decoder: CoreCoderProfile;
  filter: {
    graph: string;
    settings: Record<string, unknown>;
  };
  overlays?: Array<{
    path: string;
    width?: string;
    height?: string;
    x?: string;
    y?: string;
  }>;
};

export type CoreProfile = {
  video: CoreMediaProfile;
  audio: CoreMediaProfile;
};

export type CoreOutput = {
  address: string;
  options: FFmpegOption[];
};
