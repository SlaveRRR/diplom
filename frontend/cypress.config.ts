import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { defineConfig } from 'cypress';
import { lighthouse, prepareAudit } from 'cypress-lighthouse-plugin';
import { allureCypress } from 'allure-cypress/reporter';

export default defineConfig({
  screenshotOnRunFailure: false,
  e2e: {
    baseUrl: 'http://localhost:5173/',
    setupNodeEvents(on, config) {
      on('before:browser:launch', (_, launchOptions) => {
        prepareAudit(launchOptions);
      });

      on('task', {
        lighthouse: lighthouse(async (lighthouseResult) => {
          const filePath = path.join('..', 'lighthouse-json', 'lighthouse-report.json');
          const dirPath = path.dirname(filePath);

          await mkdir(dirPath, { recursive: true });

          await writeFile(filePath, lighthouseResult.report);
        }),
      });

      allureCypress(on, config, {
        resultsDir: '../allure-results',
      });

      return config;
    },
  },
});
