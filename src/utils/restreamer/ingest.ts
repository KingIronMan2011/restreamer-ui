import type RestreamerClient from '../restreamer';

export async function UpsertIngest(
  this: RestreamerClient,
  channelid: any,
  global: any,
  inputs: any,
  outputs: any,
  control: any,
) {
  const channel = this.GetChannel(channelid);
  if (!channel) {
    return [null, { message: 'Unknown channel ID' }];
  }

  const proc: Record<string, any> = {
    type: 'ffmpeg',
    id: channel.id,
    reference: channel.channelid,
    input: [] as any[],
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

  for (let i in inputs) {
    const input = inputs[i];

    proc.input.push({
      id: 'input_' + i,
      address: input.address,
      options: input.options.map((o: any) => '' + o),
    });
  }

  // 1. Add output address and options

  // 1.1 Fetch core config
  const core_config = this.ConfigActive();

  // 1.2 Fetch rtmp settings
  const rtmp_config = core_config.source.network.rtmp;
  let rtmp_enabled = false;
  if (control.rtmp && control.rtmp.enable && rtmp_config.enabled) {
    rtmp_enabled = true;
  }
  const inputAddress = String(proc.input[0]?.address ?? '');
  const isLocalProtocolInput = (protocol: 'rtmp' | 'srt') =>
    (inputAddress.includes(`${protocol}://localhost`) ||
      inputAddress.includes(`{${protocol},`)) &&
    inputAddress.includes(channel.channelid) &&
    !inputAddress.includes('ingest');

  if (isLocalProtocolInput('rtmp')) {
    rtmp_enabled = false;
    control.rtmp.enable = true;
  }

  // 1.3 Fetch srt settings
  const srt_config = core_config.source.network.srt;
  let srt_enabled = false;
  if (control.srt.enable && srt_config.enabled) {
    srt_enabled = true;
  }
  if (isLocalProtocolInput('srt')) {
    srt_enabled = false;
    control.srt.enable = true;
  }

  // 1.4 'tee_muxer' is required for the delivery of one output to multiple endpoints without processing the input for each output
  // http://ffmpeg.org/ffmpeg-all.html#tee-1
  let tee_muxer = false;
  if (rtmp_enabled || srt_enabled) {
    tee_muxer = true;
  }

  // 1.5 Set hls filename vars
  const hlsStorage = control.hls.storage;
  let segmentPlaylistPath =
    `${channel.channelid}` + (control.hls.master_playlist ? `_{outputid}` : '');
  let segmentFilePath =
    `${channel.channelid}` +
    (control.hls.master_playlist ? `_{outputid}_%04d` : '_%04d');
  if (hlsStorage === 'diskfs') {
    // diskfs (path structure)
    segmentFilePath =
      `${channel.channelid}` +
      (control.hls.master_playlist ? `/{outputid}/%Y%m%d/%s` : '/%Y%m%d/%s');
  }

  // 1.6 Set hls filenames
  const hls_master_playlist = `${channel.channelid}.m3u8`;
  const hls_fmp4_init_filename = `${channel.channelid}.mp4`;
  const hls_segment_playlist = `{${hlsStorage}}/${segmentPlaylistPath}.m3u8`;
  const hls_segment_filename =
    `{${hlsStorage}` +
    (tee_muxer ? '^:' : '') +
    `}/${segmentFilePath}.` +
    (!control.hls.lhls && control.hls.version === 7 ? 'mp4' : 'ts');

  // 2. Add output address

  const output = {
    id: 'output_0',
    address: hls_segment_playlist,
    options: ['-dn', '-sn', ...outputs[0].options.map((o: any) => '' + o)],
    cleanup: [] as any[],
  };

  // 3. Extend output options

  // 3.1 Injects a metadata link as title
  const metadata = `${this.GetPublicHTTPAddress()}/${channel.channelid}/oembed.json`;
  const metadata_options = [
    '-metadata',
    `title=${metadata}`,
    '-metadata',
    'service_provider=datarhei-Restreamer',
  ];
  output.options.push(...metadata_options);

  // Manifest versions
  // https://developer.apple.com/documentation/http_live_streaming/about_the_ext-x-version_tag
  // https://ffmpeg.org/ffmpeg-all.html#Options-53

  // 3.2 Returns the raw l/hls parameters for an EXT-X-VERSION

  // fix Malformed AAC bitstream detected for hls version 7
  let hls_aac_adtstoasc = false;

  const getHLSParams = (version: any) => {
    let hls_flags = 'append_list+program_date_time+temp_file';
    if (parseInt(control.hls.listSize) > 0) {
      hls_flags += '+delete_segments';
    }

    switch (version) {
      case 6:
        hls_flags += '+independent_segments';
        return [
          ['f', 'hls'],
          ['start_number', '0'],
          ['hls_time', '' + parseInt(control.hls.segmentDuration)],
          ['hls_list_size', '' + parseInt(control.hls.listSize)],
          ['hls_flags', hls_flags],
          ['hls_delete_threshold', '4'],
          ['hls_segment_filename', hls_segment_filename],
        ];
      case 7:
        // fix Malformed AAC bitstream detected for hls version 7
        if (
          output.options.includes('-codec:a') &&
          output.options.includes('copy')
        ) {
          if (!tee_muxer) {
            output.options.push('-bsf:a', 'aac_adtstoasc');
          }
          hls_aac_adtstoasc = true;
        }
        hls_flags += '+independent_segments';
        return [
          ['f', 'hls'],
          ['start_number', '0'],
          ['hls_time', '' + parseInt(control.hls.segmentDuration)],
          ['hls_list_size', '' + parseInt(control.hls.listSize)],
          ['hls_flags', hls_flags],
          ['hls_delete_threshold', '4'],
          ['hls_segment_type', 'fmp4'],
          ['hls_fmp4_init_filename', hls_fmp4_init_filename],
          ['hls_fmp4_init_resend', '1'],
          ['hls_segment_filename', hls_segment_filename],
        ];
      // case 3
      default:
        return [
          ['f', 'hls'],
          ['start_number', '0'],
          ['hls_time', '' + parseInt(control.hls.segmentDuration)],
          ['hls_list_size', '' + parseInt(control.hls.listSize)],
          ['hls_flags', hls_flags],
          ['hls_delete_threshold', '4'],
          ['hls_segment_filename', hls_segment_filename],
        ];
    }
  };
  const hls_params_raw = getHLSParams(control.hls.version);

  // 3.3 Use strftime for DiskFS
  if (control.hls.storage && control.hls.storage === 'diskfs') {
    hls_params_raw.push(['strftime', '1'], ['strftime_mkdir', '1']);
  }

  // 3.4 Push master playlist params
  if (control.hls.master_playlist) {
    hls_params_raw.push(
      ['master_pl_name', hls_master_playlist],
      ['master_pl_publish_rate', `${control.hls.segmentDuration}`],
    );
  }

  // 3.5 Use HTTP method
  if (control.hls.storage && control.hls.storage !== 'diskfs') {
    hls_params_raw.push(['method', 'PUT']);
  }

  // 3.6 Overwrite output files
  proc.options.push('-y');

  // 3.7 Returns the l/hls parameters with or without tee_muxer
  if (tee_muxer) {
    // f=hls:start_number=0...
    const hls_params = hls_params_raw
      .filter((o) => {
        // unsupported in tee_muxer
        return !(
          o[0] === 'segment_format_options' || o[0] === 'max_muxing_queue_size'
        );
      })
      .map((o) => o[0] + '=' + o[1])
      .join(':');

    // set flags
    if (control.process.low_delay) {
      output.options.push('-flags', '+low_delay+global_header');
    } else {
      output.options.push('-flags', '+global_header');
    }

    output.options.push('-tag:v', '7', '-tag:a', '10', '-f', 'tee');
    // ['f=hls:start_number=0...]address.m3u8
    // use tee_muxer formatting
    output.address =
      `[${hls_aac_adtstoasc ? 'bsfs/a=aac_adtstoasc:' : ''}${hls_params}]${hls_segment_playlist}` +
      (rtmp_enabled ? `|[f=flv]{rtmp,name=${channel.channelid}.stream}` : '') +
      (srt_enabled
        ? `|[f=mpegts]{srt,name=${channel.channelid},mode=publish}`
        : '');
  } else {
    // ['-f', 'hls', '-start_number', '0', ...]
    // adding the '-' in front of the first option, then flatten everything
    const hls_params = hls_params_raw
      .map((o) => ['-' + o[0], o[1]])
      .reduce((acc, val) => acc.concat(val), []);

    // set flags
    if (control.process.low_delay) {
      output.options.push('-flags', '+low_delay');
    }

    output.options.push(...hls_params);
  }

  // 4. Add output cleanup jobs

  // 4.1 Set hls cleanup filename vars
  let cleanupSegmentFilePath =
    `${channel.channelid}` +
    (control.hls.master_playlist ? `_{outputid}_**` : '_**');
  if (hlsStorage === 'diskfs') {
    // diskfs (path structure)
    cleanupSegmentFilePath =
      `${channel.channelid}` +
      (control.hls.master_playlist ? `/{outputid}/**` : '/**');
  }

  // 4.2 Set hls cleanup filenames
  const cleanup_global = `${hlsStorage}:/${channel.channelid}**`;
  const cleanup_hls_master_playlist = `${hlsStorage}:/${channel.channelid}.m3u8`;
  const cleanup_hls_fmp4_init_filename = `${hlsStorage}:/${channel.channelid}.mp4`;
  const cleanup_hls_segment_playlist = `${hlsStorage}:/${segmentPlaylistPath}.m3u8`;
  const cleanup_hls_segment_filename =
    `${hlsStorage}:/${cleanupSegmentFilePath}.` +
    (!control.hls.lhls && control.hls.version === 7 ? 'mp4' : 'ts');

  // 4.3 Cleanup id* (process is deleted) + continuously hls_segment_playlist and hls_segment_filename
  if (control.hls.cleanup === true) {
    output.cleanup.push(
      {
        pattern: cleanup_global,
        purge_on_delete: true,
      },
      {
        pattern: cleanup_hls_segment_playlist,
        max_file_age_seconds:
          parseInt(control.hls.listSize) > 0
            ? parseInt(control.hls.segmentDuration) *
              (parseInt(control.hls.listSize) + 6)
            : 0,
        purge_on_delete: true,
      },
      {
        pattern: cleanup_hls_segment_filename,
        max_files:
          parseInt(control.hls.listSize) > 0
            ? parseInt(control.hls.listSize) + 6
            : 0,
        max_file_age_seconds:
          parseInt(control.hls.listSize) > 0
            ? parseInt(control.hls.segmentDuration) *
              (parseInt(control.hls.listSize) + 6)
            : 0,
        purge_on_delete: true,
      },
    );

    // 4.4 Cleanup hls_master_playlist
    if (control.hls.master_playlist) {
      output.cleanup.push({
        pattern: cleanup_hls_master_playlist,
        max_file_age_seconds:
          parseInt(control.hls.listSize) > 0
            ? parseInt(control.hls.segmentDuration) *
              (parseInt(control.hls.listSize) + 6)
            : 0,
        purge_on_delete: true,
      });
    }

    // 4.5 Cleanup hls_fmp4_init_filename
    if (!control.hls.lhls && control.hls.version === 7) {
      output.cleanup.push({
        pattern: cleanup_hls_fmp4_init_filename,
        max_file_age_seconds:
          parseInt(control.hls.listSize) > 0
            ? parseInt(control.hls.segmentDuration) *
              (parseInt(control.hls.listSize) + 6)
            : 0,
        purge_on_delete: true,
      });
    }
  }

  // 5. Push output
  proc.output.push(output);

  const [val, err] = await this._upsertProcess(channel.id, proc);
  if (err !== null) {
    return [val, err];
  }

  this.SetChannel(channelid, {
    ...channel,
    available: true,
  });

  return [val, null];
}
