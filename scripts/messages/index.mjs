// Message catalog of the runner: every message for a person (errors,
// diagnostics, the terminal view, the summary, usage, task class texts) is a
// key in en.mjs and pl.mjs. t(locale, key, params) fills the named {params}
// of the message; an unknown locale, key or parameter is a programming error.
import { AsyncLocalStorage } from 'node:async_hooks';
import en from './en.mjs';
import pl from './pl.mjs';

export const LOCALES = Object.freeze(['en', 'pl']);
export const DEFAULT_LOCALE = 'en';
const CATALOGS = Object.freeze({ en, pl });
const PARAMETER = /\{([A-Za-z][A-Za-z0-9]*)\}/g;

export function isLocale(value) {
  return typeof value === 'string' && LOCALES.includes(value);
}

export function t(locale, key, params = {}) {
  if (!isLocale(locale)) throw new TypeError(`Unknown locale ${String(locale)}.`);
  const catalog = CATALOGS[locale];
  if (!Object.hasOwn(catalog, key))
    throw new TypeError(`Unknown message key ${String(key)}.`);
  return catalog[key].replace(PARAMETER, (_, name) => {
    if (!Object.hasOwn(params, name))
      throw new TypeError(`Message ${key} needs the parameter ${name}.`);
    return String(params[name]);
  });
}

// The names of the {params} of a message, in order of appearance.
export function messageParameters(message) {
  return [...message.matchAll(PARAMETER)].map(([, name]) => name);
}

// Locale of the code that runs inside withLocale: a run of the loop sets the
// locale of its profile for every message it creates, also deep in the call
// stack. Outside of it the default applies.
const localeContext = new AsyncLocalStorage();

export function currentLocale() {
  return localeContext.getStore() ?? DEFAULT_LOCALE;
}

export function withLocale(locale, callback) {
  if (!isLocale(locale)) throw new TypeError(`Unknown locale ${String(locale)}.`);
  return localeContext.run(locale, callback);
}

// A message in the current locale.
export function msg(key, params) {
  return t(currentLocale(), key, params);
}
