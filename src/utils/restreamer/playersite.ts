import Handlebars from 'handlebars';

import type RestreamerClient from '../restreamer';

export async function UpdatePlayersite(this: RestreamerClient) {
  let metadata = await this.GetMetadata();

  const settings = this.InitPlayersiteSettings(metadata.playersite);
  settings.player = 'videojs';

  if (settings.playersite === false) {
    await this._removePlayersiteEssentials();
    return true;
  }

  // update the player files
  await this._updatePlayerEssentials(settings.player);

  // update the playersite files
  await this._updatePlayersiteEssentials();

  // use preferred channel
  let channel = this.GetChannel(settings.channelid);
  if (channel === null) {
    channel = this.GetChannel(this.GetCurrentChannelID());
  }
  if (channel === null) {
    return false;
  }

  // filter channels based on the main channel and additional channels
  const channels = this.ListChannels().filter(
    (c) =>
      settings.channel_list.indexOf(c.channelid) !== -1 ||
      c.channelid === channel.channelid,
  );

  // Handlebars function ifEquals
  Handlebars.registerHelper(
    'ifEquals',
    function (this: any, arg1: any, arg2: any, options: any) {
      return arg1 === arg2 ? options.fn(this) : options.inverse(this);
    },
  );

  Handlebars.registerHelper(
    'ifnoteq',
    function (this: any, arg1: any, arg2: any, options: any) {
      if (arg1 !== arg2) {
        return options.fn(this);
      }
      return options.inverse(this);
    },
  );

  for (const item of channels) {
    const ingestMetadata = await this.GetIngestMetadata(item.channelid);
    const templateData = {
      player: settings.player,
      playersite: settings.playersite,
      title: settings.title,
      share: settings.share,
      support: settings.support,
      chromecast: settings.chromecast,
      airplay: settings.airplay,
      url: this.GetPlayersiteUrl(),
      textcolor_title: settings.textcolor_title,
      textcolor_default: settings.textcolor_default,
      textcolor_link: settings.textcolor_link,
      textcolor_link_hover: settings.textcolor_link_hover,
      bgcolor_header: settings.bgcolor_header,
      bgcolor_selected: settings.bgcolor_selected,
      bgcolor_unselected: settings.bgcolor_unselected,
      hrcolor: settings.hrcolor,
      bgcolor_default: settings.bgcolor_default,
      bgimage_url: settings.bgimage_url,
      imprint_html: settings.imprint.replace(/(?:\r\n|\r|\n)/g, '<br />'),
      terms_html: settings.terms.replace(/(?:\r\n|\r|\n)/g, '<br />'),
      inject1: settings.inject1,
      inject2: settings.inject2,
      inject3: settings.inject3,
      inject4: settings.inject4,
      channels: channels,
      channel_id: item.channelid,
      channel_name: ingestMetadata.meta.name,
      channel_description: ingestMetadata.meta.description,
      channel_description_html: ingestMetadata.meta.description.replace(
        /(?:\r\n|\r|\n)/g,
        '<br />',
      ),
      channel_creator_name: ingestMetadata.meta.author.name,
      channel_creator_description: ingestMetadata.meta.author.description,
      channel_creator_description_html:
        ingestMetadata.meta.author.description.replace(
          /(?:\r\n|\r|\n)/g,
          '<br />',
        ),
      channel_license: ingestMetadata.license,
      channel_poster: this.GetChannelPosterPath(
        item.channelid,
        ingestMetadata.control.hls.storage,
      ),
      channel_width: 640,
      channel_height: 360,
    };

    // upload playersite.html
    let playersite = '';
    if (settings.template !== '!default') {
      playersite = await this.GetPlayersiteTemplate(settings.template);
      if (playersite.length === 0) {
        settings.template = '!default';
      }
    }

    if (settings.template === '!default') {
      playersite = await this._getLocalAssetAsString('/_playersite/index.html');
    }

    if (item.channelid === channel.channelid) {
      playersite = Handlebars.compile(playersite)(templateData);
      await this._uploadAssetData('/index.html', playersite);
    }

    playersite = Handlebars.compile(playersite)(templateData);
    await this._uploadAssetData(
      '/playersite_' + item.channelid + '.html',
      playersite,
    );

    // Upload player config for each channel
    await this.UpdatePlayerConfig(item.channelid, ingestMetadata);
  }

  // Upload player implementation
  await this._uploadAssetData(
    '/playersite/player.js',
    await this._getLocalAssetAsString(`/_playersite/${settings.player}.js`),
  );

  return true;
}
