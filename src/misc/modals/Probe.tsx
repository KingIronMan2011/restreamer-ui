import React from 'react';

import TextareaModal from './Textarea';

const Component = function ({
  open = false,
  data = '',
  title = '',
  onClose = null as (() => void) | null,
  onHelp = null as (() => void) | null,
}: any) {
  return (
    <TextareaModal
      open={open}
      title={title}
      onClose={onClose}
      onHelp={onHelp}
      rows={18}
      value={data}
      readOnly
      allowCopy
    />
  );
};

export default Component;
