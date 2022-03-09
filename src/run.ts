import { log, logSuccess } from "./logging";
import { program } from "commander";
import { loadInputXml, loadScript, runScript, saveOutputXml } from "./run-lib";

program
	.name("rekordbox.xml.js CLI")
	.description("CLI for running scripts that use the rekordbox.xml.js library")
	.argument("<script>", "The script to run, e.g. 'hotcues-to-memorycues'")
	.argument("<input-xml>", "The input .xml file, e.g. '../my-rekordbox.xml'")
	.argument(
		"[output-xml]",
		"The output .xml file, e.g. '../result.xml'. " +
		"This is optional because scripts may not output a .xml file " +
		"and only show some text output in the terminal."
	)
	.option("-t, --time", "Print the script execution time")
	.parse();

const main = async (): Promise<void> => {
	const [scriptName, inputXmlFile, maybeOutputXmlFile] = program.args;

	log("Loading script and input .xml file...");
	const [script, library] = await Promise.all([
		loadScript(scriptName),
		loadInputXml(inputXmlFile)
	]);

	if (script.returnsLibrary && maybeOutputXmlFile === undefined) {
		console.error("Script returns a library but no output file was specified");
		process.exit(1);
	}

	log(`Running script "${scriptName}"...`);

	console.time("Script execution time");
	const maybeLibrary = await runScript(script, library);

	if (program.getOptionValue("time") === true) {
		console.timeEnd("Script execution time");
	}

	if (maybeLibrary !== undefined) {
		log(`Saving library to "${maybeOutputXmlFile}"...`);
		await saveOutputXml(maybeLibrary, maybeOutputXmlFile);
		logSuccess(`Library saved to "${maybeOutputXmlFile}"`);
	} else {
		logSuccess("Finished script execution.");
	}
};

void main();
