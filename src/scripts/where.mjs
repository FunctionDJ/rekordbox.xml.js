import {
	getXml,
	getTrackByFilePath,
	prompt,
	getPlaylistsOfTrack,
	trackToString,
} from "../lib.mjs";

import chalk from "chalk";

// const file = process.argv[2]

// try {
// 	if (!file) {
// 		throw new Error("No file handed")
// 	}

// 	path.parse(file)
// } catch (error) {
// 	console.error("Error with input: " + error.message)
// 	setTimeout(() => console.log("End"), 99999)
// }

let xml = getXml();

(async () => {
	while (true) {
		const search = await prompt();
		// const search = "d:\\Sync\\deemix\\ALRT\\ALRT - My Level.mp3"
		console.log(""); // Linebreak
		const track = getTrackByFilePath(await xml, search);

		if (!track) {
			console.error(chalk.red("Konnte nicht gefunden werden"));
			continue;
		}

		console.log(chalk.green(`Gefunden: ${trackToString(track)}`));
		console.log(chalk.blue("Suche in Playlists..."));
		const playlists = getPlaylistsOfTrack(await xml, track);
		console.log(chalk.green(`Track ist in ${playlists.length} Playlist(s) enthalten`));

		if (playlists.length > 0) {
			console.log(chalk.green("Playlists:"), chalk.green(playlists.map(p => `${p.name} [${p.count}]`).join(", ")));
		}
	}
})();
