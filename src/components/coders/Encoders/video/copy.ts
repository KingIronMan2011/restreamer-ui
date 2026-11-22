import React from 'react';

import Helper from '../../helper';

function createMapping(settings: any, stream: any, skills: any) {
  stream = Helper.InitStream(stream);
  skills = Helper.InitSkills(skills);

  const local = ['-codec:v', 'copy'];

  const mapping = {
    global: [],
    local: local,
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
  settings = {};
  stream = Helper.InitStream(stream);
  skills = Helper.InitSkills(skills);

  const handleChange = (newSettings: any, automatic = false) => {
    onChange(
      newSettings,
      createMapping(newSettings, stream, skills),
      automatic,
    );
  };

  React.useEffect(() => {
    handleChange(settings, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

function summarize(settings: any) {
  return `${name}`;
}

function defaults(stream: any, skills: any) {
  return {
    settings: {},
    mapping: createMapping({}, stream, skills),
  };
}

const coder = 'copy';
const name = 'Passthrough (copy)';
const codec = 'copy';
const type = 'video';
const hwaccel = false;

export {
  coder,
  name,
  codec,
  type,
  hwaccel,
  summarize,
  defaults,
  Coder as component,
};
