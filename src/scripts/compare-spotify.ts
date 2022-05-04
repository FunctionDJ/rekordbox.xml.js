/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable import/no-absolute-path */
import { Folder as SpotifyFolder } from "../../../get-spotify-playlists/src/types/general-types";
import { Playlist as RekordboxPlaylist } from "../rekordbox/core/playlist";
import { Folder as RekordboxFolder } from "../rekordbox/core/folder";
import { RXScript } from "../shared";
// @ts-expect-error
import spotifyExportUntyped from "C:\\Users\\Function\\Desktop\\get-spotify-playlists\\out.json";
import {
	OptimizedExport,
	OptimizedPlaylist,
	OptimizedTrack,
} from "C:\\Users\\Function\\Desktop\\get-spotify-playlists\\src\\optimize\\optimized-types";
import { Track } from "../rekordbox/core/track";

const spotifyExport = spotifyExportUntyped as OptimizedExport;

let missingCount = 0;
let mismatchCount = 0;

const compareArrayExhaustive = <T>(listA: T[], listB: T[]): void => {
	let listBModifieable = Array.from(listB);

	for (const item of listA) {
		if (listBModifieable.includes(item)) {
			listBModifieable = listBModifieable.filter((i) => i !== item);
		} else {
			throw new MismatchError(`listB doesn't contain ${item}`);
		}
	}
};

const compareArrayLoosely = <T>(listA: T[], listB: T[]): void => {
	if (!listB.includes(listA[0])) {
		throw new MismatchError(`listB doesn't contain ${listA[0]}`);
	}
};

const normalizeSongName = (name: string): string => {
	const trimmedAndLowerCased = name.trim().toLowerCase();
	return trimmedAndLowerCased
		.replaceAll(/[\(\)'\-’"]/gi, "")
		.replaceAll(/\s+/g, " ");
};

const compareSongNames = (nameA: string, nameB: string): void => {
	if (normalizeSongName(nameA) !== normalizeSongName(nameB)) {
		throw new MismatchError("title");
	}
};

const blacklistedNodes = [
	"20JpCVhq3U1wwejecFz9m1",
	"3ASrSrgSpb4KHDsXtiqEAa",
	"57a46a47ddce980c",
];

class MismatchError extends Error {}

const spotifyTrackToString = (spotifyTrack: OptimizedTrack): string => {
	const spotifyArtists = spotifyTrack.artist_indexes.map(
		(i) => spotifyExport.artists[i]
	);

	return `${spotifyArtists.join(", ")} - ${spotifyTrack.name}`;
};

const rekordboxTrackToString = (rekordboxTrack: Track): string =>
	`${rekordboxTrack.artist} - ${rekordboxTrack.name}`;

const compareTracks = (
	spotifyTrack: OptimizedTrack,
	rekordboxTrack: Track
): void => {
	const rbArtists = rekordboxTrack.guessArtists();
	const spotifyArtists = spotifyTrack.artist_indexes.map(
		(i) => spotifyExport.artists[i]
	);

	// compareArrayLoosely(
	// 	spotifyArtists.map((a) => a.toLowerCase()),
	// 	rbArtists.map((a) => a.toLowerCase())
	// );
	compareSongNames(spotifyTrack.name, rekordboxTrack.name);
};

const comparePlaylists = (
	spotifyPlaylist: OptimizedPlaylist,
	rekordboxPlaylist: RekordboxPlaylist
): void => {
	const rbTracks = rekordboxPlaylist.getTracks();

	for (const [index, spotifyTrack] of spotifyPlaylist.tracks
		.map((t) => spotifyExport.tracks[t.track_index])
		.entries()) {
		const foundCorrespondingTrack = rbTracks.find((rbTrack) => {
			const normA = normalizeSongName(spotifyTrack.name);
			const normB = normalizeSongName(rbTrack.name);

			return normB.includes(normA);
		});

		if (foundCorrespondingTrack === undefined) {
			missingCount++;
			console.error(
				`${spotifyPlaylist.name} #${index}: ${spotifyTrackToString(
					spotifyTrack
				)}`
			);
		}
	}

	return;
	let spotifyPos = 0;
	let rekordboxPos = 0;
	let lastSuccessfulSpotifyPos = 0;

	const maxLength = Math.max(spotifyPlaylist.tracks.length, rbTracks.length);

	while (spotifyPos < maxLength && rekordboxPos < maxLength) {
		const spotifyPlTrack = spotifyPlaylist.tracks[spotifyPos];
		const spotifyTrack = spotifyExport.tracks[spotifyPlTrack.track_index];
		const correspondingTrack = rbTracks[rekordboxPos];

		if (correspondingTrack === undefined) {
			console.error(
				`${
					spotifyPlaylist.name
				}: Missing tracks starting at ${spotifyPos}. Expected: ${spotifyTrackToString(
					spotifyTrack
				)}`
			);

			break;
		}

		try {
			compareTracks(spotifyTrack, correspondingTrack);

			spotifyPos++;
			lastSuccessfulSpotifyPos = spotifyPos;
			rekordboxPos++;
		} catch (error) {
			if (error instanceof MismatchError) {
				console.error(
					`${spotifyPlaylist.name}: Track mismatch at ${spotifyPos}:\n` +
						`  Spotify   : ${spotifyTrackToString(spotifyTrack)}\n` +
						`  Rekordbox : ${rekordboxTrackToString(correspondingTrack)}`
				);

				spotifyPos++;

				if (spotifyPos === maxLength) {
					spotifyPos = lastSuccessfulSpotifyPos + 1;
					rekordboxPos++;
				}
			} else {
				throw error;
			}
		}
	}
};

const compareFolders = (
	spotifyFolder: SpotifyFolder,
	rekordboxFolder: RekordboxFolder
): void => {
	const rbChildren = rekordboxFolder.getNodes();

	const allowedChildren = spotifyFolder.children.filter(
		(n) => !blacklistedNodes.includes(n.id)
	);

	for (const child of allowedChildren) {
		const childType = "children" in child ? "folder" : "playlist";
		const corresponding = rbChildren.find(
			(n) => n.name === child.name && n.getType() === childType
		);

		if (corresponding === undefined) {
			mismatchCount++;
			console.error(
				`mismatch: spotify ${child.name} [${child.id}] [${childType}] rekordbox undefined or wrong type`
			);

			continue;
		}

		if (childType === "folder") {
			compareFolders(child as SpotifyFolder, corresponding as RekordboxFolder);
		} else {
			comparePlaylists(
				child as OptimizedPlaylist,
				corresponding as RekordboxPlaylist
			);
		}
	}
};

export const script: RXScript = {
	returnsLibrary: false,
	run: async (lib) => {
		const dnbRootSpotify = spotifyExport.playlists.find(
			(pl): pl is SpotifyFolder => pl.name === "D&B" && "children" in pl
		);

		if (dnbRootSpotify === undefined) {
			throw new Error("spotify root undefined");
		}

		const dnbRootRB = lib.rootNode
			.getFolders()
			.find((f) => f.name === "Drum & Bass");

		if (dnbRootRB === undefined) {
			throw new Error("rb root undefined");
		}

		compareFolders(dnbRootSpotify, dnbRootRB);
		console.log("missing", missingCount);
		console.log("mismatch", mismatchCount);
	},
};
