import { Library } from "./library";
import { access } from "node:fs/promises";
import {
	addSafe,
	dateToRekordbox,
	decodeRekordboxLocation,
	isSameFilepath,
	limitText,
	removeSafe,
	XMLSerializable,
} from "../misc/lib";
import { ITrackReference } from "../xml-types/nodes";
import { ITrack } from "../xml-types/tracks";
import { Beatgrid } from "./beatgrid";
import { Cues } from "./cues";
import { Playlist } from "./playlist";
import path from "path/posix";

export interface RequiredTrackProperties {
	id: string;
	size: number;
	averageBpm: number;
	bitRate: string;
	sampleRate: number;
	location: string;
}

export class Track implements XMLSerializable<ITrack> {
	readonly id: string;
	name: string = "";
	artist: string = "";
	composer: string = "";
	album: string = "";
	grouping: string = "";
	genre: string = "";
	kind: string = "";
	size: number;
	totalTime: number = 0;
	discNumber: number = 0;
	trackNumber: number = 0;
	year: string = "";
	averageBpm: number;
	dateModified?: Date;
	dateAdded: Date = new Date();
	bitRate: string;
	sampleRate: number;
	comments: string = "";
	playCount: number = 0;
	lastPlayed?: Date;
	rating: string = "0";
	location: string;
	remixer: string = "";
	tonality: string = "";
	label: string = "";
	mix: string = "";
	colour?: string;

	private beatgrid: Beatgrid = new Beatgrid([], this);

	getBeatgrid(): Beatgrid {
		return this.beatgrid;
	}

	setBeatgrid(newBeatgrid: Beatgrid): void {
		this.beatgrid.unregisterTrack(this);
		this.beatgrid = newBeatgrid;
		this.beatgrid.registerTrack(this);
	}

	private cues: Cues = new Cues(this);

	getCues(): Cues {
		return this.cues;
	}

	setCues(newCues: Cues): void {
		this.cues.unregisterTrack(this);
		this.cues = newCues;
		this.cues.registerTrack(this);
	}

	private readonly playlists: Set<Playlist> = new Set();

	registerPlaylist(playlist: Playlist): void {
		if (!this.playlists.has(playlist)) {
			addSafe(this.playlists, playlist);
		}
	}

	/** Creates an array from the playlists that the tracks knows */
	getPlaylists(): Playlist[] {
		return Array.from(this.playlists);
	}

	isInPlaylist(playlist: Playlist): boolean {
		return this.playlists.has(playlist);
	}

	unregisterPlaylist(playlist: Playlist): void {
		removeSafe(this.playlists, playlist);
	}

	constructor(
		public library: Library,
		requiredProperties: RequiredTrackProperties
	) {
		this.id = requiredProperties.id;
		this.size = requiredProperties.size;
		this.averageBpm = requiredProperties.averageBpm;
		this.bitRate = requiredProperties.bitRate;
		this.sampleRate = requiredProperties.sampleRate;
		this.location = requiredProperties.location;
	}

	serialize(): ITrack {
		return {
			TrackID: this.id,
			Name: this.name,
			Artist: this.artist,
			Composer: this.composer,
			Album: this.album,
			Grouping: this.grouping,
			Genre: this.genre,
			Kind: this.kind,
			Size: String(this.size),
			TotalTime: String(this.totalTime),
			DiscNumber: String(this.discNumber),
			TrackNumber: String(this.trackNumber),
			Year: String(this.year),
			AverageBpm: String(this.averageBpm),
			DateModified:
				this.dateModified !== undefined
					? dateToRekordbox(this.dateModified)
					: undefined,
			DateAdded: dateToRekordbox(this.dateAdded),
			BitRate: this.bitRate,
			SampleRate: String(this.sampleRate),
			Comments: this.comments,
			PlayCount: String(this.playCount),
			LastPlayed:
				this.lastPlayed !== undefined
					? dateToRekordbox(this.lastPlayed)
					: undefined,
			Rating: this.rating,
			Location: `file://localhost/${encodeURIComponent(this.location)}`,
			Remixer: this.remixer,
			Tonality: this.tonality,
			Label: this.label,
			Mix: this.mix,
			Colour: this.colour,
			TEMPO: this.beatgrid.serialize(),
			POSITION_MARK: this.cues.serialize(),
		};
	}

	static createFromXML(library: Library, data: ITrack): Track {
		const track = new Track(library, {
			id: data.TrackID,
			averageBpm: Number.parseFloat(data.AverageBpm),
			bitRate: data.BitRate,
			location: decodeRekordboxLocation(data.Location),
			sampleRate: Number.parseInt(data.SampleRate),
			size: Number.parseInt(data.Size, 10),
		});

		track.name = data.Name;
		track.artist = data.Artist;
		track.composer = data.Composer;
		track.album = data.Album;
		track.grouping = data.Grouping;
		track.genre = data.Genre;
		track.kind = data.Kind;
		track.totalTime = Number.parseInt(data.TotalTime, 10);
		track.discNumber = Number.parseInt(data.DiscNumber, 10);
		track.trackNumber = Number.parseInt(data.TrackNumber, 10);
		track.year = data.Year;

		if (data.DateModified !== undefined) {
			track.dateAdded = new Date(data.DateAdded);
		}

		track.dateAdded = new Date(data.DateAdded);
		track.comments = data.Comments;
		track.playCount = Number.parseInt(data.PlayCount, 10);

		if (data.LastPlayed !== undefined) {
			track.lastPlayed = new Date(data.LastPlayed);
		}

		track.rating = data.Rating;
		track.remixer = data.Remixer;
		track.tonality = data.Tonality;
		track.label = data.Label;
		track.mix = data.Mix;

		if (data.Colour !== undefined) {
			track.colour = data.Colour;
		}

		track.beatgrid.fillFromXML(data.TEMPO ?? []);
		track.cues.fillFromXML(data.POSITION_MARK ?? []);

		return track;
	}

	createSerialReference(): ITrackReference {
		return {
			Key: this.id,
		};
	}

	async readID3Tags(): Promise<void> {}

	equals(track: Track): boolean {
		return track.id === this.id;
	}

	setRecordboxLocation(rekordboxLocation: string): void {
		const locationRegex = /^file:\/\/localhost\/(.*)$/;
		const result = locationRegex.exec(rekordboxLocation);

		if (result === null) {
			throw new Error(
				"unknown location format: " + JSON.stringify(rekordboxLocation)
			);
		}

		this.location = decodeURIComponent(result[1]);
	}

	isSameLocation(location: string): boolean {
		return isSameFilepath(this.location, location);
	}

	/**
	 * Calls `fs` {@link access()} with {@link Track.location}
	 */
	async existsOnDisk(): Promise<boolean> {
		try {
			await access(this.location);
			return true;
		} catch (error: any) {
			if (error.code !== "ENOENT") {
				throw error;
			}

			return false;
		}
	}

	async missingFromDisk(): Promise<boolean> {
		return this.existsOnDisk().then((v) => !v);
	}

	toString(options?: { id?: boolean; long?: boolean }): string {
		if (options?.long ?? false) {
			const parts = options?.id ? [`TrackID: ${this.id}`] : [];

			parts.push(
				`Name: ${this.name}`,
				`Artist: ${this.artist}`,
				`Genre: ${this.genre}`
			);

			return parts.join(", ");
		}

		let output = options?.id ?? false ? `[${this.id}] ` : "";
		output += `${limitText(this.artist, 60)} - ${limitText(this.name, 70)}`;
		return output;
	}

	getPlaylistsReport(): Array<{ name: string; count: number }> {
		const playlists: Array<{
			name: string;
			count: number;
		}> = [];

		this.library.rootNode.walkNodesReportOnTrackContained(
			this,
			(playlist, count) => {
				playlists.push({ name: playlist.name, count });
			}
		);

		return playlists;
	}

	/**
	 * Splits the {@link artist} field by forward slash `/`,
	 * which seems to be the standard method of adding multiple artists to the TPE1 ID3 field.
	 *
	 * There are artist names where this might cause issues, like `"Axwell /\ Ingrosso"` => `["Axwell", "\Ingrosso"]`
	 */
	guessArtists(alsoSplitByComma = false): string[] {
		const regex = alsoSplitByComma ? /[,/]/g : /\//g;
		return this.artist.split(regex).map((a) => a.trim());
	}

	/**
	 * Parses the file extension from the **{@link location} field, not the {@link kind} field (!)**
	 * @returns a value like `"mp3"`, `"wav"` etc. (no leading period and doesn't change upper/lowercase)
	 */
	getFileExtension(): string {
		return path.parse(this.location).ext.slice(1);
	}
}
