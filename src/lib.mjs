import readline from "readline";
import path from "path";

const autoContinueExpressions = [".mp3", ".flac", ".aac", ".m4a", ".ogg", ".mp4"];

export const prompt = async () => {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise(r => {
		const handler = () => {
			const normalised = normaliseDragnDrop(rl.line);

			if (!normalised) {
				return;
			}

			const parsed = path.parse(normalised);

			const doFinish = autoContinueExpressions.includes(parsed.ext);

			if (doFinish) {
				finish();
			}
		};

		const finish = ans => {
			rl.close();
			rl.input.removeListener("keypress", handler);
			r(normaliseDragnDrop(ans ?? rl.line));
		};

		rl.input.addListener("keypress", handler);

		rl.question("File? ", ans => {
			finish(ans);
		});
	});
};

const vscodeRegex = /^& '([a-z]:\\.+\.\w+)'$/;
const psRegex = /^"([A-Z]:\\.+\.\w+)"$/;
const gitBashRegex = /^'\/([a-z])\/(.+\.\w+)'$/;
const unescVscRegex = /^\w:\\.*\.\w+$/;

/**
 * @param {String} dirty
 * @returns {String|undefined}
 */
const normaliseDragnDrop = dirty => {
	const trimmed = dirty.trim();

	const vscodeResult = vscodeRegex.exec(trimmed);

	if (vscodeResult) {
		return vscodeResult[1];
	}

	const psResult = psRegex.exec(trimmed);

	if (psResult) {
		return psResult[1];
	}

	const gitBashResult = gitBashRegex.exec(trimmed);

	if (gitBashResult) {
		return path.join(
			gitBashResult[1] + ":",
			gitBashResult[2],
		);
	}

	const unescVscResult = unescVscRegex.exec(trimmed);

	if (unescVscResult) {
		return unescVscResult[0];
	}

	return undefined;
};

