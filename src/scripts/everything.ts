import { execFile as execFileCB } from "child_process";
import { promisify } from "util";

const execFile = promisify(execFileCB);

const setCodePageToUTF8 = async (): Promise<ReturnType<typeof execFile>> => (
	await execFile("CHCP", ["65001"])
);

let isUTF8 = false;

export const everything = async (query: string): Promise<string[]> => {
	if (!isUTF8) {
		await setCodePageToUTF8();
		isUTF8 = true;
	}

	const { stdout, stderr } = await execFile(
		"es.exe",
		[query],

		{ windowsVerbatimArguments: true }
		// important because otherwise args with spaces get wrapped in quotes which just becomes a huge mess
	);

	if (stderr.trim() !== "") {
		throw new Error(stderr);
	}

	return stdout
		.split("\n")
		.map(line => line.trim())
		.filter(line => line !== "");
};
