import { XMLParser } from "fast-xml-parser";
import * as fs from "fs/promises";
import { Library } from "../core/library";
import { measure } from "./helpers";
import { RekordboxXML } from "../xml-types/rekordbox-xml";

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: "",
	isArray: (_name, jpath, _isLeafNode, isAttribute) => { // TODO verbesserungen möglich
		if (isAttribute) {
			return false;
		}

		if ([
			"DJ_PLAYLISTS",
			"DJ_PLAYLISTS.PLAYLISTS",
			"DJ_PLAYLISTS.PLAYLISTS.NODE",
			"DJ_PLAYLISTS.COLLECTION",
			"DJ_PLAYLISTS.PRODUCT"
		].includes(jpath)) {
			return false;
		}

		return true;
	},
	// preserveOrder: true,
	parseTagValue: false,
	processEntities: true,
	trimValues: false
});

interface LoadLibraryReturnType {
	xmlTime: string
	library: Library
	libraryTime: string
	parseTime: string
}

export const loadLibrary = async (filePath: string): Promise<LoadLibraryReturnType> => {
	const [xmlTime, rbxXmlString] = await measure(async () => await fs.readFile(filePath, "utf-8"));
	const [parseTime, raw]: readonly [string, RekordboxXML] = await measure(() => parser.parse(rbxXmlString));
	const [libraryTime, library] = await measure(() => Library.createFromXML(raw));

	return {
		xmlTime,
		library,
		libraryTime,
		parseTime
	};
};
