import { KarmaRunner } from "./karma/karma-runner";
import { TestServerValidation } from "./test-server/test-server-validation";
import { KarmaEventListener } from "./integration/karma-event-listener";
import { Logger } from "./shared/logger";
import { TestSuiteInfo } from "vscode-test-adapter-api";
import { TestExplorerConfiguration } from "../model/test-explorer-configuration";
import { TestServer } from "../model/test-server";

export class AngularKarmaTestExplorer {
  public constructor(
    private readonly karmaRunner: KarmaRunner,
    private readonly testServerValidation: TestServerValidation,
    private readonly logger: Logger,
    private readonly testServer: TestServer,
    private readonly karmaEventListener: KarmaEventListener
  ) {}

  public async loadTests(config: TestExplorerConfiguration): Promise<TestSuiteInfo> {
    if (!this.testServerValidation.isValidProject(config.projectRootPath, config.projectType)) {
      return {} as TestSuiteInfo;
    }

    if (this.karmaRunner.isKarmaRunning()) {
      await this.testServer.stopAsync();
    }

    this.logger.info("Test Loading started...");

    await this.testServer.start(config);

    const testSuiteInfo = await this.karmaRunner.loadTests(config.projectRootPath);

    this.logger.info("Test Loading completed!");

    return testSuiteInfo;
  }

  public async runTests(tests: string[]): Promise<void> {
    await this.karmaRunner.runTests(tests);

    const { testStatus, runCompleteEvent } = this.karmaEventListener;

    this.logger.status(testStatus);

    this.logger.info("Run completed with status: " + runCompleteEvent.results);
  }

  public async stopCurrentRun(): Promise<void> {
    if (this.karmaRunner.isKarmaRunning()) {
      await this.testServer.stopAsync();
    }
  }

  public debugTests(tests: string[]): void {
    throw new Error("Not Implemented");
  }

  public dispose(): void {
    if (this.karmaRunner.isKarmaRunning()) {
      this.testServer.stop();
    }
  }
}
