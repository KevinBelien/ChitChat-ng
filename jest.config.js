module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  // globals: {
  //   'ts-jest': {
  //     stringifyContentPathRegex: '\\.(html|svg)$',

  //     tsconfig: '<rootDir>/tsconfig.spec.json',
  //   },
  // },
  moduleNameMapper: {
    '^@chit-chat/ng-chat/src/lib/(.*)$': '<rootDir>/projects/chit-chat/src/lib/$1',
  },
  testEnvironment: 'jsdom',
};
