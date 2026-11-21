import React from 'react';

import { render, act } from '../../utils/testing';
import '@testing-library/jest-dom';

import * as Decoders from './Decoders';
import * as Encoders from './Encoders';

const audiodecoders = Decoders.Audio.List();
const videodecoders = Decoders.Video.List();
const audioencoders = Encoders.Audio.List();
const videoencoders = Encoders.Video.List();

const testfunc = async (coder: any) => {
  const defaults = coder.defaults();

  let $settings: Record<string, any> = {};
  let $mapping: Record<string, any> = {};

  const handleChange = (settings: any, mapping: any) => {
    $settings = settings;
    $mapping = mapping;
  };

  await act(async () => {
    render(<coder.component onChange={handleChange} />);
  });

  expect($settings).toStrictEqual(defaults.settings);
  expect($mapping).toStrictEqual(defaults.mapping);
};

test.each(audiodecoders as any[])('coder:decoder:$type $coder', testfunc);
test.each(videodecoders as any[])('coder:decoder:$type $coder', testfunc);
test.each(audioencoders as any[])('coder:encoder:$type $coder', testfunc);
test.each(videoencoders)('coder:encoder:$type $coder', testfunc);
