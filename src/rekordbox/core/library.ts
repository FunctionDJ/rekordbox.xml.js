import { isSameFilepath, Loosen, XMLSerializable } from "../misc/lib";
import { Playlist } from "./playlist";
import { RekordboxXML } from "../xml-types/rekordbox-xml";
import { RequiredTrackProperties, Track } from "./track";
import * as fs from "fs/promises";
import { XMLBuilder } from "fast-xml-parser";
import { ITrack } from "../xml-types/tracks";
import { Folder } from "./folder";
import { Product } from "./product";
import { RekordboxNode } from "./rb-node";
import { IRootFolder } from "../xml-types/nodes";
import { measure, measureSync } from "../misc/helpers";
import { IDCollisionError } from "../misc/shared-errors";
import { loadLibrary } from "../misc/bridge";

interface MissingTrackReport {
	tracks: Track[]
	missingTracks: Track[]
	missingFraction: number
}

export class Library implements XMLSerializable<RekordboxXML> {
	// track methods

	private readonly tracks: Track[] = [];

	// create

	public createTrackFromXML (data: ITrack): Track {
		const track = Track.createFromXML(this, data);
		this.addTrack(track);
		return track;
	}

	public createTrack (requiredProperties: RequiredTrackProperties): Track {
		const track = new Track(this, requiredProperties);
		this.addTrack(track);
		return track;
	}

	// read

	private getIndexOfTrack (track: Track): number|null {
		const index = this.tracks.findIndex(t => t.equals(track));
		return index === -1 ? null : index;
	}

	public getTrackById (id: string): Track|null {
		for (let i = 0; i < this.tracks.length; i++) { // .find is slow
			const track = this.tracks[i];
			if (track.id === id) {
				return track;
			}
		}

		return null;
	}

	public hasTrack (track: Track): boolean {
		return Boolean(this.getTrackById(track.id));
	}

	public getTracks (): Track[] {
		return Array.from(this.tracks);
	}

	// update

	public addTracks (newTracks: Track[]): void {
		// this method is optimized for performance when adding many tracks (e.g. init)
		const knownIds = this.tracks.map(t => t.id);

		for (let i = 0; i < newTracks.length; i++) {
			const track = newTracks[i];

			for (let j = 0; j < knownIds.length; j++) { // faster than .find
				if (knownIds[j] === track.id) {
					throw new IDCollisionError();
				}
			}

			knownIds.push(track.id);
			this.tracks.push(track);
		}
	}

	public addTrack (track: Track): void {
		if (this.hasTrack(track)) { // todo maybe check for same location too?
			throw new IDCollisionError();
		}

		this.tracks.push(track);
	}

	// delete

	/**
	 * **WARNING!**
	 *
	 * You can't apply the removal of tracks to your own Rekordbox library.
	 *
	 * You can only import tracks and apply the changes to them.
	 *
	 * If you want to remove tracks from your actual library, create a new playlist with the tracks you want to remove and add the tracks to it and save the library.
	 *
	 * Then go into Rekordbox, import the playlist, and from there use the Rekordbox feature to remove the tracks from your Collection.
	 *
	 * There might be a function at some point that sets this up for you.
	 *
	 * This method will do what it's supposed to do, but it's probably only useful for tracks that are currently not in the Rekordbox library you intend to import the generated XML into anyway.
	 */
	removeTrack (track: Track): void {
		const index = this.getIndexOfTrack(track);

		if (index === null) {
			throw new Error("Can't remove track that's not in the library");
		}

		this.tracks.splice(index, 1);
	}

	// self methods

	public product: Product;
	public version = "1.0.0";

	constructor (productVersion: string) {
		this.product = new Product(productVersion);
	}

	// create

	static createFromXML (data: RekordboxXML): Library {
		const library = new Library(data.DJ_PLAYLISTS.Version);
		library.product.fillFromXML(data.DJ_PLAYLISTS.PRODUCT);

		const tracksData = data.DJ_PLAYLISTS.COLLECTION.TRACK ?? [];
		const tracks = tracksData.map(raw => Track.createFromXML(library, raw));
		library.addTracks(tracks);

		const nodes = data.DJ_PLAYLISTS.PLAYLISTS.NODE.NODE ?? [];

		for (let i = 0; i < nodes.length; i++) { // performance
			const node = nodes[i];
			if (node.Type === "0") {
				const folder = Folder.createFromXML(library, library, node);
				library.addNode(folder, true);
			} else {
				const playlist = Playlist.createFromXML(library, library, node);
				library.addNode(playlist, true);
			}
		}

		return library;
	}

	static async createFromXMLFile (path: string): Promise<Library> {
		const { library } = await loadLibrary(path);
		return library;
	}

	shiftHotCuesPrepareEngine (): void {
		// TODO implement
	}

	/**
	 * ***WARNING***
	 * For every track that has at least 1 Hot Cue, it will
	 * remove **all** Memory Cues and re-create the Memory Cues
	 * to be the same as the Hot Cues.
	 *
	 * Purpose: Being able to see and also partially use
	 * all 8 Hot Cues (or more) on Pioneer gear with only 3 Hot Cue buttons,
	 * like the CDJ-2000nexus (1).
	 */
	cloneHotCuesToMemoryCues (): void {
		this.tracks
			.filter(t => t.getCues().getHotCues().length > 0)
			.forEach(t => t.getCues().cloneMemoryCuesToHotCues());
	}

	/**
	 * Because this method needs to make an fs.access call on
	 * every file in the collection, it might take a long time.
	 * The built-in feature in Rekordbox is probably faster.
	 */
	async getTracksWithMissingFiles (): Promise<Track[]> {
		const tracksWithMissingFiles = [];

		for (const track of this.tracks) {
			if (!await track.existsOnDisk()) {
				tracksWithMissingFiles.push(track);
			}
		}

		return tracksWithMissingFiles;
	}

	// node methods

	public readonly rootNode = new Folder(this, this, "ROOT");

	// create

	public createFolder (name: string, nodes?: RekordboxNode[]): Folder {
		const folder = new Folder(this, this, name, nodes);
		this.addNode(folder);
		return folder;
	}

	public createPlaylist (name: string, tracks?: Track[]): Playlist {
		const playlist = new Playlist(this, this, name, tracks);
		this.addNode(playlist);
		return playlist;
	}

	/** Adds a folder or playlist. Also adds all contained tracks to library recursively. */
	addNode (node: Playlist|Folder, skipAddTracksToLibrary = false): void {
		this.rootNode.addNode(node);

		if (skipAddTracksToLibrary) {
			return;
		}

		const allTracks = node.getRecursiveTracks();

		for (let i = 0; i < allTracks.length; i++) { // performance
			const track = allTracks[i];
			if (!this.hasTrack(track)) {
				this.addTrack(track);
			}
		}
	}

	// read

	findPlaylistByName (name: string): Playlist|null {
		return this.rootNode.getNodesRecursive()
			.find(n => n.isPlaylist() && n.name === name) as Playlist ?? null;
	}

	removeNode (node: Playlist|Folder): void {
		this.rootNode.removeNode(node);
	}

	findTrackByFilePath (filePath: string): Track|null {
		return this.tracks.find(t => {
			return isSameFilepath(t.location, filePath);
		}) ?? null;
	}

	serialize (): Loosen<RekordboxXML> {
		const rootSerialized = this.rootNode.serialize() as IRootFolder;

		return {
			DJ_PLAYLISTS: {
				COLLECTION: {
					Entries: this.tracks.length,
					TRACK: this.tracks.map(t => t.serialize())
				},
				PLAYLISTS: {
					NODE: rootSerialized ?? undefined
				},
				PRODUCT: this.product.serialize(),
				Version: this.version
			}
		};
	}

	async save (filePath: string): Promise<{ buildTime: string, writeTime: string}> {
		const builder = new XMLBuilder({
			attributeNamePrefix: "",
			format: true,
			ignoreAttributes: false,
			unpairedTags: ["unpaired"],
			suppressEmptyNode: true
		});

		const [buildTime, xmlString] = measureSync(() => builder.build(this.serialize()));
		const patchedString = xmlString.replaceAll(/&(?!\w+;)/gm, "&amp;");
		const [writeTime] = await measure(async () => await fs.writeFile(filePath, patchedString));
		return { buildTime, writeTime };
	}

	/**
	 * Calls {@link Track.existsOnDisk()}
	 */
	async getMissingTrackReport (): Promise<MissingTrackReport> {
		const missingTracks: Track[] = [];
		const tracks = this.getTracks();

		for (const track of tracks) {
			if (!await track.existsOnDisk()) {
				missingTracks.push(track);
			}
		}

		const missingFraction = (missingTracks.length / tracks.length);

		return {
			tracks,
			missingTracks,
			missingFraction
		};
	}
}
