import assert from "assert";
import { log, logSuccess } from "../logging";
import { Library } from "../rekordbox/core/library";

log("Comparing playlists...");

void (async () => {
	const [oldLib, newLib] = await Promise.all([
		Library.createFromXMLFile("../output.xml"),
		Library.createFromXMLFile("../output_after_purge.xml")
	]);

	const oldNodes = oldLib.rootNode.getNodesRecursive();
	const newNodes = newLib.rootNode.getNodesRecursive();

	assert(oldNodes.length === newNodes.length);

	for (let i = 0; i < oldNodes.length; i++) {
		const oldNode = oldNodes[i];
		const newNode = newNodes[i];

		assert(oldNode.name === newNode.name);
		assert(oldNode.getRecursiveTracks().length === newNode.getRecursiveTracks().length);
	}

	logSuccess("Everything gucci");
})();
