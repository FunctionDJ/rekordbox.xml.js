import { Track } from "./track";
import { Loosen, XMLSerializable } from "../misc/lib";
import { IPlaylist } from "../xml-types/nodes";
import { IdentifiableNode } from "./rb-node";
import { Library } from "./library";
import { Folder } from "./folder";

export class Playlist
	extends IdentifiableNode
	implements XMLSerializable<IPlaylist>
{
	constructor(
		private readonly library: Library,
		private readonly parent: Library | Folder,
		name: string,
		private tracks: Track[] = []
	) {
		super("playlist", name);
		tracks.forEach((t) => t.registerPlaylist(this));
	}

	public getTracks(): Track[] {
		return [...this.tracks];
	}

	public getLibrary(): Library {
		return this.library;
	}

	public getParentFolder(): Library | Folder {
		return this.parent;
	}

	static createFromXML(
		library: Library,
		parent: Library | Folder,
		data: IPlaylist
	): Playlist {
		const tracks = (data.TRACK ?? []).map((t) => {
			const track = library.getTrackById(t.Key);

			if (track === null) {
				// todo maybe add to library if missing?
				throw new Error(
					`Could not find track "${t.Key}" in track pool while populating playlist.`
				);
			}

			return track;
		});

		return new Playlist(library, parent, data.Name, tracks);
	}

	serialize(): Loosen<IPlaylist> {
		return {
			Entries: this.tracks.length,
			KeyType: "0",
			Name: this.name,
			Type: "1",
			TRACK: this.tracks.map((t) => t.createSerialReference()),
		};
	}

	// todo addNewTrack

	hasTrack(track: Track): boolean {
		for (let i = 0; i < this.tracks.length; i++) {
			if (this.tracks[i].equals(track)) {
				return true;
			}
		}

		return false;
	}

	removeTrack(track: Track, all = false): void {
		if (!this.hasTrack(track)) {
			throw new Error(
				`Can't remove track: Playlist "${
					this.name
				}" doesn't contain track "${track.toString()}"`
			);
		}

		if (this.getCountOfTrack(track) > 1 && !all) {
			throw new Error(
				`Can't remove track because "all = true" was not passed: Playlist "${
					this.name
				}" contains more than 1 instance of track "${track.toString()}"`
			);
		}

		this.tracks = this.tracks.filter((t) => !t.equals(track));
	}

	/**
	 * @todo overloads for positioning after track / at index
	 */
	addTrack(track: Track, ignoreDuplicate = false): void {
		if (!ignoreDuplicate && this.hasTrack(track)) {
			throw new Error(
				`Could not add track: Playlist "${
					this.name
				}" already contains track "${track.toString()}"`
			);
		}

		this.tracks.push(track);
	}

	getCountOfTrack(track: Track): number {
		return this.tracks.filter((t) => t.equals(track)).length;
	}
}
