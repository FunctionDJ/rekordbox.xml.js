import { Library } from "./rekordbox/core/library";
import { loadLibrary } from "./rekordbox/misc/bridge";
import { RXScript } from "./shared";

export const loadScript = async (scriptName: string): Promise<RXScript> => {
	try {
		const module = await import(`./scripts/${scriptName}`);
		return module.script;
	} catch (error) {
		console.error("An error occured while loading the script:", error);
		process.exit(1);
	}
};

export const loadInputXml = async (inputXmlFile: string): Promise<Library> => {
	try {
		const { library } = await loadLibrary(inputXmlFile); // TODO differentiate between failed FS load and library creation
		return library;
	} catch (error) {
		console.error(
			"An error occurred while loading the input .xml file and creating the library:",
			error
		);
		process.exit(1);
	}
};

export const runScript = async (
	script: RXScript,
	library: Library
): Promise<undefined | Library> => {
	try {
		const thing = await script.run(library);

		if (thing !== undefined) {
			return thing;
		}

		return;
	} catch (error) {
		console.error("An error occurred while running the script:", error);
		process.exit(1);
	}
};

export const saveOutputXml = async (
	library: Library,
	outputXmlFile: string
): Promise<void> => {
	try {
		await library.save(outputXmlFile); // TODO differentiate between XML generation and FS call
	} catch (error) {
		console.error(
			"An error occurred while saving the output .xml file:",
			error
		);
		process.exit(1);
	}
};
