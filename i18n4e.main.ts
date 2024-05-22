import * as process from 'process';
import express, { Request, Response, NextFunction } from 'express';
import { wrapperAddTranslationsRoute } from './core/routes';
import * as path from 'path';
import { getLanguagesFilesPaths } from './core/files.handler';
import { options as optionsInterface, I18n4e } from './core/interfaces';
import { wrapperPreviousLocalsMiddleware as previousLocalsMiddleware } from './core/middleware';

function getCallerFile(position: number = 2): string | undefined {
  // credits: https://github.com/stefanpenner/get-caller-file/blob/master/index.ts
  if (position >= Error.stackTraceLimit) {
    throw new TypeError(
      'getCallerFile(position) requires position be less then Error.stackTraceLimit but position was: `' +
        position +
        '` and Error.stackTraceLimit was: `' +
        Error.stackTraceLimit +
        '`'
    );
  }

  const oldPrepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack) => stack;
  const stack = new Error().stack;
  Error.prepareStackTrace = oldPrepareStackTrace;

  if (stack !== null && typeof stack === 'object') {
    return stack[position] ? (stack[position] as any).getFileName() : undefined;
  }
}

const i18n4e: I18n4e = {
  langsFilesPath: {},
  defaultLang: 'en',
  path: '/i18n4e/i/translations',
  init: (
    app: any,
    options: optionsInterface = {
      defaultLang: undefined,
      langsFolder: undefined,
      mainFile: undefined,
      extraFiles: undefined,
      previousLocalsMiddleware: true,
      path: undefined,
    },
    renderBeforeDocument: boolean = false
  ): Promise<any> => {
    if (options.defaultLang) i18n4e.defaultLang = options.defaultLang;

    if (options.path) i18n4e.path = options.path;

    if (options.previousLocalsMiddleware) {
      app.use(previousLocalsMiddleware({ i18n4e }));
    }

    const caller = getCallerFile(2);
    const callerPathParts = caller?.split('\\');
    const callerPathPartsNoLast = callerPathParts?.slice(0, -1);
    const finalPath = callerPathPartsNoLast?.join('\\');

    if (!finalPath)
      throw new Error('i18n4e (Init Error): Unable to get caller path.');

    if (options.langsFolder) {
      options.langsFolder = path.resolve(
        finalPath || './',
        options.langsFolder
      );
    } else {
      options.langsFolder = finalPath + '/_locales';
    }

    return getLanguagesFilesPaths(options)
      .then((filesPaths: any) => {
        i18n4e.langsFilesPath = filesPaths;
        console.log('Returned Values', filesPaths);

        if (!renderBeforeDocument) {

          wrapperAddTranslationsRoute(app, { i18n4e });

        };


        return filesPaths;
      })
      .catch((err: Error) => {
        console.error(
          `\x1b[3m\x1b[34m[i18n4e\x1b[0m \x1b[31m\x1b[1mError\x1b[0m \x1b[3m\x1b[34m(On Init)]\x1b[0m  \x1b[33m-->\x1b[0m \x1b[31m\x1b[1m${err.message}\x1b[0m`
        );
        throw new Error('i18n4e (Init Error)');
      });
  },
};

export { i18n4e };
