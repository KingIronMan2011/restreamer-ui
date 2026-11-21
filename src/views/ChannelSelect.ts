import React from 'react';
import { useNavigate } from 'react-router';

export default function ChannelSelector({ channelid = '' }: any) {
  const navigate = useNavigate();
  const [$channelid, setChannelid] = React.useState('');

  React.useEffect(() => {
    onMount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    navigate(`/${$channelid}`, { replace: true });
  }, [navigate, $channelid]);

  const onMount = () => {
    setChannelid(channelid);
  };

  return null;
}
