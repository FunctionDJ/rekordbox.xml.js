/* eslint-disable @typescript-eslint/restrict-template-expressions */
import chalk from "chalk";

export const logTime = (text: any): void => {
	console.log(chalk.gray(`◽ ${text}`));
};

export const log = (text: any): void => {
	console.log(chalk.blueBright(`◾ ${text}`));
};

export const logSuccess = (text: any): void => {
	console.log(chalk.green(`✔️  ${text}`));
};

export const logWarn = (text: any): void => {
	console.log(chalk.yellow(`⚠️  ${text}`));
};
