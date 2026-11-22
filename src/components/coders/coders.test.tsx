import React from 'react';

import { render, act } from '../../utils/testing';
import * as Decoders from './Decoders';
import * as Encoders from './Encoders';

const audiodecoders = Decoders.Audio.List();
const videodecoders = Decoders.Video.List();
const audioencoders = Encoders.Audio.List();
const videoencoders = Encoders.Video.List();

const testfunc = async (coder: any) => {
  const defaults = coder.defaults();
  if (typeof coder.summarize === 'function') {
    expect(coder.summarize(defaults.settings)).toEqual(expect.any(String));
  }

  let $settings: Record<string, any> = {};
  let $mapping: Record<string, any> = {};

  const handleChange = (settings: any, mapping: any) => {
    $settings = settings;
    $mapping = mapping;
  };

  const view = render(<coder.component onChange={handleChange} />);

  expect($settings).toStrictEqual(defaults.settings);
  expect($mapping).toStrictEqual(defaults.mapping);

  view.unmount();
  await act(async () => {
    render(<coder.component />);
  });
};

test.each(audiodecoders as any[])('coder:decoder:$type $coder', testfunc);
test.each(videodecoders as any[])('coder:decoder:$type $coder', testfunc);
test.each(audioencoders as any[])('coder:encoder:$type $coder', testfunc);
test.each(videoencoders)('coder:encoder:$type $coder', testfunc);

test.each([
  ['audio decoder', Decoders.Audio],
  ['video decoder', Decoders.Video],
  ['audio encoder', Encoders.Audio],
  ['video encoder', Encoders.Video],
])('%s registry filters and looks up coders', (_label, registry: any) => {
  const entries = registry.List();
  const coder = entries[0];
  expect(registry.Coders()).toContain(coder.coder);
  expect(registry.Get(coder.coder)).toBe(coder);
  expect(registry.Get('missing-coder')).toBeNull();
  registry.Register({ type: 'mismatched', coder: 'ignored' });
  expect(registry.Get('ignored')).toBeNull();

  const codec = coder.codecs?.[0] ?? coder.codec;
  if (codec) {
    const matching = entries.find((entry: any) =>
      entry.codecs
        ? entry.codecs.includes(codec) || entry.codecs.length === 0
        : entry.codec === codec,
    );
    expect(registry.GetCoderForCodec(codec, [matching.coder])).toBe(matching);
    expect(registry.GetCoderForCodec(codec, [])).toBeNull();
    expect(
      registry.GetCodersForCodec(
        codec,
        entries.map((entry: any) => entry.coder),
        'any',
      ).length,
    ).toBeGreaterThan(0);
  }
  expect(registry.GetCodersForCodec('missing-codec', [], 'any')).toEqual([]);
  const available = entries.map((entry: any) => entry.coder);
  const software = registry.GetCodersForCodec(codec, available, 'no');
  const hardware = registry.GetCodersForCodec(codec, available, 'yes');
  expect(
    [...software, ...hardware].every((entry: any) =>
      available.includes(entry.coder),
    ),
  ).toBe(true);
});

it('selects hardware decoders for supported codecs and skips unavailable ones', () => {
  const available = Decoders.Video.Coders();
  const hardwareDecoder = Decoders.Video.GetCoderForCodec('h264', available);
  expect(hardwareDecoder).not.toBeNull();
  expect(
    Decoders.Video.GetCoderForCodec('h264', ['not-an-available-decoder']),
  ).toBeNull();
  expect(
    Decoders.Video.GetCodersForCodec('h264', available, 'yes').some(
      (coder) => coder.hwaccel === true,
    ),
  ).toBe(true);
});

it('returns hardware video encoders when codec and availability match', () => {
  const available = Encoders.Video.Coders();
  expect(
    Encoders.Video.GetCodersForCodec('h264', available, 'yes').some(
      (coder) => coder.hwaccel === true,
    ),
  ).toBe(true);
});
