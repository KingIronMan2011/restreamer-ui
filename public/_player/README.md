# Player Templates

Affected files: `(clappr|videojs)/player.html`, `oembed.json`, and `oembed.xml`.

The templates are interpreted with [handlebars](https://handlebarsjs.com/).

The following placeholders will be replaced by their respective value:

| Placeholder | Description                               |
| ----------- | ----------------------------------------- |
| name        | The user-given name of the ingest.        |
| description | The user-given description of the ingest. |
| iframecode  | The HTML iframe code for the player.      |
| poster      | The URL to the latest snapshot image.     |
| width       | The width of the video/poster.            |
| height      | The height of the video/poster.           |

## File list

Add a `files.txt` to a player directory when it has supplemental files that need to
be copied besides `player.html`. The file is optional when the player has no
supplemental assets.
