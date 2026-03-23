import { useSelector } from 'react-redux';

const containsProperty = (object, key) => object.hasOwnProperty(key) && object[key] !== null;

export const usePreference = (key, defaultValue) =>
  useSelector((state) => {
    const server = state.session.server;
    const user = state.session.user;

    if (server?.forceSettings) {
      if (server && containsProperty(server, key)) {
        return server[key];
      }
      if (user && containsProperty(user, key)) {
        return user[key];
      }
      return defaultValue;
    }
    if (user && containsProperty(user, key)) {
      return user[key];
    }
    if (server && containsProperty(server, key)) {
      return server[key];
    }
    return defaultValue;
  });

export const useAttributePreference = (key, defaultValue) =>
  useSelector((state) => {
    const server = state.session.server;
    const user = state.session.user;

    if (server?.forceSettings) {
      if (server?.attributes && containsProperty(server.attributes, key)) {
        return server.attributes[key];
      }
      if (user?.attributes && containsProperty(user.attributes, key)) {
        return user.attributes[key];
      }
      return defaultValue;
    }
    if (user?.attributes && containsProperty(user.attributes, key)) {
      return user.attributes[key];
    }
    if (server?.attributes && containsProperty(server.attributes, key)) {
      return server.attributes[key];
    }
    return defaultValue;
  });
