import { Loosen, XMLSerializable } from "../misc/lib";
import { Library } from "./library";
import { Playlist } from "./playlist";
import { IdentifiableNode, RekordboxNode } from "./rb-node";
import { Track } from "./track";
import { IFolder, IPlaylist } from "../xml-types/nodes";

export class Folder extends IdentifiableNode implements XMLSerializable<IFolder> {
	constructor (
		private readonly library: Library,
		private readonly parent: Folder|Library,
		name: string,
		/**
		 * @todo immutable, mutable... what if someone uses this prop to populate something else and mutates it?
		 * should all access be clones / immutable??
		 */
		private nodes: RekordboxNode[] = []
	) {
		super("folder", name);
	}

	static createFromXML (
		library: Library,
		parent: Library|Folder,
		data: IFolder
	): Folder {
		const folder = new Folder(library, parent, data.Name);

		for (let i = 0; i < (data.NODE?.length ?? 0); i++) {
			const childNodeData = data.NODE![i];
			if (childNodeData.Type === "0") {
				folder.createFolderFromXML(childNodeData);
			} else {
				folder.createPlaylistFromXML(childNodeData);
			}
		}

		return folder;
	}

	serialize (): Loosen<IFolder> {
		return {
			Count: this.nodes.length,
			Name: this.name,
			Type: "0",
			NODE: this.nodes.map(n => n.serialize())
		};
	}

	/**
	 * @todo add positioning options
	 */
	createPlaylist (name: string, tracks?: Track[]): Playlist {
		const playlist = new Playlist(this.library, this, name, tracks);
		this.addNode(playlist);
		return playlist;
	}

	createFolder (name: string, nodes?: RekordboxNode[]): Folder {
		const folder = new Folder(this.library, this, name, nodes);
		this.addNode(folder);
		return folder;
	}

	createPlaylistFromXML (data: IPlaylist): Playlist {
		const playlist = Playlist.createFromXML(this.library, this, data);
		this.addNode(playlist);
		return playlist;
	}

	createFolderFromXML (data: IFolder): Folder {
		const folder = Folder.createFromXML(this.library, this, data);
		this.addNode(folder);
		return folder;
	}

	addNode (node: RekordboxNode): void {
		for (let i = 0; i < this.nodes.length; i++) {
			if (this.nodes[i].name === node.name) {
				throw new Error(`Can't add node "${node.name}" to ${this.name} because there's already a node with the same name`);
			}
		}

		this.nodes.push(node);
	}

	removeNode (node: RekordboxNode): void {
		if (this.nodes.find(n => n === node) === undefined) {
			throw new Error(`Can't remove node "${node.name}" from "${this.name}" because it's not part of it`);
		}

		this.nodes = this.nodes.filter(n => n !== node);
	}

	removeNodes (): void {
		this.nodes = [];
	}

	getFolders (): Folder[] {
		return this.nodes
			.filter((n): n is Folder => n.isFolder());
	}

	getPlaylists (): Playlist[] {
		return this.nodes
			.filter((n): n is Playlist => n.isPlaylist());
	}

	getNodes (): Array<Playlist|Folder> {
		return [...this.nodes];
	}

	setNodes (nodes: RekordboxNode[]): void {
		// todo hier muss mit sicherheit noch viel mehr gecheckt werden
		this.nodes = [...nodes];
	}

	getNodesRecursive (): RekordboxNode[] {
		const allNodes: RekordboxNode[] = [];
		allNodes.push(...this.getPlaylists());

		for (const folder of this.getFolders()) { // performance
			const nodes = folder.getNodesRecursive();
			allNodes.push(folder, ...nodes);
		}

		return allNodes;
	}

	walkNodesReportOnTrackContained (
		track: Track,
		report: (playlist: Playlist, count: number) => void
	): void {
		for (let i = 0; i < this.nodes.length; i++) { // performance
			const node = this.nodes[i];

			if (node.isPlaylist()) {
				const count = node.getCountOfTrack(track);

				if (count > 0) {
					report(node, count);
				}
			} else {
				node.walkNodesReportOnTrackContained(track, report);
			}
		}
	}
}
