import { Folder } from "./folder";
import { Playlist } from "./playlist";
import { Track } from "./track";

export type RekordboxNode = Folder | Playlist;

type IdentifiableNodeType = "folder" | "playlist";

export abstract class IdentifiableNode {
	constructor (
		private readonly type: IdentifiableNodeType,
		public name: string
	) {}

	getType (): IdentifiableNodeType {
		return this.type;
	}

	isPlaylist (): this is Playlist {
		return this.type === "playlist";
	}

	isFolder (): this is Folder {
		return this.type === "folder";
	}

	getRecursiveTracks (): Track[] {
		if (this.isPlaylist()) {
			return this.getTracks();
		}

		if (this.isFolder()) {
			const nodes = this.getNodes();

			const tracks = [];

			for (let i = 0; i < nodes.length; i++) {
				const subTracks = nodes[i].getRecursiveTracks();
				tracks.push(...subTracks);
			}

			return tracks;
		}

		return [];
	}
}
