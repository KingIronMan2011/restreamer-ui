import type RestreamerClient from '../restreamer';

export async function UpdateEgress(
  this: RestreamerClient,
  channelid: any,
  id: any,
  global: any,
  inputs: any,
  outputs: any,
  control: any,
) {
  const channel = this.GetChannel(channelid);
  if (!channel) {
    return null;
  }

  if (!channel.egresses.includes(id)) {
    return null;
  }

  const egress = this.GetChannelEgress(channelid, id);
  if (!egress) {
    return null;
  }

  if (!Array.isArray(outputs)) {
    outputs = [outputs];
  }

  // from the inputs only the first is used and only its options are considered.

  let address = '';
  let options: any[] = [];
  if (control.source.source === 'hls+memfs') {
    address = `{memfs}/${channel.channelid}.m3u8`;
    options.push('-re');
  } else if (control.source.source === 'hls+diskfs') {
    address = `{diskfs}/${channel.channelid}.m3u8`;
    options.push('-re');
  } else if (control.source.source === 'rtmp') {
    address = `{rtmp,name=${channel.channelid}.stream}`;
    const skills = this.Skills();
    if (skills.ffmpeg.version_major >= 6) {
      const codecs: any[] = [];
      if (skills.codecs.video.hevc?.length > 0) {
        codecs.push('hvc1');
      }
      if (skills.codecs.video.av1?.length > 0) {
        codecs.push('av01');
      }
      if (skills.codecs.video.vp9?.length > 0) {
        codecs.push('vp09');
      }

      if (codecs.length !== 0) {
        options.push('-rtmp_enhanced_codecs', codecs.join(','));
      }
    }
  } else if (control.source.source === 'srt') {
    address = `{srt,name=${channel.channelid},mode=request}`;
  }

  const config = {
    type: 'ffmpeg',
    id: egress.id,
    reference: egress.channelid,
    input: [
      {
        id: 'input_0',
        address: address,
        options: [...options, ...inputs[0].options],
      },
    ],
    output: [] as any[],
    options: [
      '-loglevel',
      'level+info',
      '-err_detect',
      'ignore_err',
      ...global,
    ],
    autostart: control.process.autostart,
    reconnect: control.process.reconnect,
    reconnect_delay_seconds: parseInt(control.process.delay),
    stale_timeout_seconds: parseInt(control.process.staleTimeout),
    limits: {
      cpu_usage: parseInt(control.limits.cpu_usage),
      memory_mbytes: parseInt(control.limits.memory_mbytes),
      waitfor_seconds: parseInt(control.limits.waitfor_seconds),
    },
  };

  for (let i in outputs) {
    const output = outputs[i];

    if (!Array.isArray(output.options)) {
      output.options = [];
    }

    // set flags
    let options: any[] = [];
    if (control.process.low_delay) {
      options.push('-flags', '+low_delay');
    }

    options.push(...output.options.map((o: any) => '' + o));

    config.output.push({
      id: 'output_' + i,
      address: output.address,
      options: options,
    });
  }

  let [val, err] = await this._upsertProcess(egress.id, config);
  return [val, err];
}
