import { Track } from "../rekordbox/core/track";
import { RXScript } from "../shared";
import { everything } from "./everything";
import { cursorTo } from "readline";
import { Promise as id3 } from "node-id3";
import fs from "fs";

const getTrackFromEverythingResults = async (paths: string[], track: Track): Promise<string> => {
	if (paths.length === 0) {
		throw new Error("No paths found");
	}

	return await Promise.any(paths.map(async filepath => {
		const tags = await id3.read(filepath);
		const hasSameTitle = tags.title?.trim().toLowerCase() === track.name.trim().toLowerCase();

		if (!hasSameTitle) {
			throw new Error("Title mismatch");
		}

		const fileArtists = tags.artist?.split(/[,/]/g).map(s => s.trim().toLowerCase()) ?? [""];

		for (const trackArtist of track.guessArtists(true)) {
			if (!fileArtists.includes(trackArtist.toLowerCase())) {
				throw new Error(`File artists doesn't include track artists "${trackArtist}"`); // todo this gets hit when "THE Black Eyes Peas" - does Rekordbox remove "The"?
			}
		}

		return filepath;
	}));
};

const getError = (error: unknown): Error => {
	if (error instanceof AggregateError) {
		return error.errors[0] as Error;
	}

	if (error instanceof Error) {
		return error;
	}

	return new Error(error as string);
};

const sanitizeForArgs = (text: string): string => (
	text.replace(/[<>():|*"?/\\]/g, " ")
);

const escapeDoubleQuotes = (text: string): string => (
	text.replaceAll("\"", " ")
);

export const script: RXScript = {
	returnsLibrary: true,
	run: async library => {
		const { tracks, missingTracks, missingFraction } = await library.getMissingTrackReport();
		console.warn(`Currently ${missingTracks.length} out of ${tracks.length} missing (${(missingFraction * 100).toFixed(2)}%).`);

		let stillMissingTracks = 0;
		const successFile = fs.createWriteStream("./output/fix-paths-success.txt", "utf-8");
		const failFile = fs.createWriteStream("./output/fix-paths-fail.txt", "utf-8");

		const total = missingTracks.length;
		for (let i = 0; i < total; i++) {
			cursorTo(process.stdout, 0);
			const percentage = (100 * (i / total)).toFixed(2);
			process.stdout.write(`Processing track #${i} (${percentage}%), still missing: ${stillMissingTracks} tracks...`);
			const track = missingTracks[i];

			if (track.getPlaylistsReport().length === 0) {
				continue;
			}

			const sanitizedTrackName = sanitizeForArgs(track.name).replaceAll(/[-!]/g, " "); // not quoted
			const sanitizedArtists = track.guessArtists(true)
				.map(sanitizeForArgs)
				.map(escapeDoubleQuotes)
				.map(a => `"${a}"`);

			const query = [
				"-path D:/Library",
				...sanitizedArtists,
				sanitizedTrackName,
				`title:"${escapeDoubleQuotes(track.name)}"` // TODO  title:"What Is Love (7  Mix)" <- bad
			].join(" ");

			const paths = await everything(query);

			try {
				const result = await getTrackFromEverythingResults(paths, track);
				successFile.write(`✔️ ${track.artist} - ${track.name}\n  ➔ ${result}\n`);
				track.location = result;
			} catch (error) {
				failFile.write(`❌ ${track.artist} - ${track.name}\n  🔍 ${query}\n  ❗ ${getError(error).message}\n`);
				stillMissingTracks++;
			}
		}
		successFile.end();
		process.stdout.write("\n");

		console.warn(`${stillMissingTracks} tracks still missing.`);
		return library;
	}
};
