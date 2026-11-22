import { Auth0Client } from '@auth0/auth0-spa-js';

import * as Storage from './storage';

let client: Auth0Client | null = null;

let isAvailable = false;

try {
  new Auth0Client({
    domain: 'example.eu.auth0.com',
    clientId: 'some_client_id',
    authorizationParams: { audience: 'https://example.com/' },
    cacheLocation: 'memory',
  });

  isAvailable = true;
} catch (e) {
  isAvailable = false;
}

const canUseAuth0 = () => {
  return isAvailable;
};

const setConfig = (config: any) => {
  Storage.Set(
    'auth0',
    JSON.stringify({
      domain: '',
      client_id: '',
      audience: '',
      redirect_uri: window.location.origin,
      ...config,
    }),
  );
};

const getConfig = () => {
  let config = {
    domain: '',
    client_id: '',
    audience: '',
    redirect_uri: window.location.origin,
  };

  const data = Storage.Get('auth0');
  if (data === null) {
    return config;
  }

  try {
    let parsedConfig = JSON.parse(data);

    config = {
      ...config,
      ...parsedConfig,
    };
  } catch (e) {}

  return config;
};

const init = () => {
  if (canUseAuth0() === false) {
    return false;
  }

  const config = getConfig();

  if (
    config.domain.length === 0 ||
    config.client_id.length === 0 ||
    config.audience.length === 0
  ) {
    return false;
  }

  try {
    client = new Auth0Client({
      domain: config.domain,
      clientId: config.client_id,
      cacheLocation: 'localstorage',
      authorizationParams: { audience: config.audience, scope: 'openid' },
    });
  } catch (e) {
    return false;
  }

  return true;
};

const handleRedirectCallback = async () => {
  if (client === null) {
    return {
      initialized: false,
    };
  }

  const urlParams = new URLSearchParams(window.location.search.substring(1));
  if (urlParams.has('error')) {
    return {
      initialized: true,
      error: true,
      description: urlParams.has('error_description')
        ? urlParams.get('error_description')
        : 'unknown error',
    };
  }

  if (urlParams.has('code') && urlParams.has('state')) {
    try {
      await client.handleRedirectCallback();
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      return {
        initialized: true,
        error: true,
        description: error.message,
      };
    }

    urlParams.delete('code');
    urlParams.delete('state');

    let hash = urlParams.get('hash');
    urlParams.delete('hash');

    let href =
      window.location.origin +
      window.location.pathname +
      '?' +
      urlParams.toString();
    if (hash !== null) {
      href += '#' + hash;
    }

    window.location.href = href;
  }

  return {
    initialized: true,
    error: false,
  };
};

const login = async (queryParams: any) => {
  if (client === null) {
    return false;
  }

  const config = getConfig();

  if (queryParams && Object.keys(queryParams).length > 0) {
    try {
      const url = new URL(config.redirect_uri);
      for (const [key, value] of Object.entries(queryParams)) {
        url.searchParams.append(key, String(value));
      }

      config.redirect_uri = url.href;
    } catch (error) {
      console.error('Error constructing redirect URI:', error);
    }
  }

  const options = {
    authorizationParams: {
      redirect_uri: config.redirect_uri,
      scope: 'openid profile email',
      audience: config.audience,
    },
  };

  try {
    await client.loginWithRedirect(options);
  } catch (e) {
    return false;
  }

  return true;
};

const logout = async () => {
  if (client === null) {
    return;
  }

  await client.logout({
    logoutParams: { returnTo: window.location.href },
    openUrl: false,
  });
};

const getToken = async () => {
  let token = '';

  if (client === null) {
    return token;
  }

  const config = getConfig();

  try {
    token =
      (await client.getTokenSilently({
        authorizationParams: {
          scope: 'openid profile email',
          audience: config.audience,
        },
      })) ?? '';
  } catch (error) {
    console.error(error);
  }

  return token;
};

const isAuthenticated = async () => {
  if (client === null) {
    return false;
  }

  return await client.isAuthenticated();
};

export {
  canUseAuth0,
  setConfig,
  getConfig,
  init,
  login,
  logout,
  isAuthenticated,
  getToken,
  handleRedirectCallback,
};
