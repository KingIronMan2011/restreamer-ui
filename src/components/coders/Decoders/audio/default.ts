import React from 'react';

import Helper from '../../helper';

function init(initialState: any) {
  const state = {
    ...initialState,
  };

  return state;
}

function createMapping(settings: any, stream: any, skills: any) {
  stream = Helper.InitStream(stream);
  skills = Helper.InitSkills(skills);

  const mapping = {
    global: [],
    local: [],
    filter: [],
  };

  return mapping;
}

function Coder({
  stream = {},
  settings = {},
  skills = {},
  onChange = function (settings: any, mapping: any) {},
}: any) {
  settings = init(settings);
  stream = Helper.InitStream(stream);
  skills = Helper.InitSkills(skills);

  const handleChange = (newSettings: any) => {
    let automatic = false;
    if (!newSettings) {
      newSettings = settings;
      automatic = true;
    }

    onChange(
      newSettings,
      createMapping(newSettings, stream, skills),
      automatic,
    );
  };

  React.useEffect(() => {
    handleChange(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

const coder = 'default';
const name = 'Default';
const codecs: any[] = [];
const type = 'audio';
const hwaccel = false;

function defaults(stream: any, skills: any) {
  const settings = init({});

  return {
    settings: settings,
    mapping: createMapping(settings, stream, skills),
  };
}

export { coder, name, codecs, type, hwaccel, defaults, Coder as component };
