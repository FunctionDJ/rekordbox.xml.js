export interface IRootFolder extends IFolder {
	Name: "ROOT"
}

/** This interface doesn't exist in the XML, it's just for inheritance / Don't-Repeat-Yourself */
interface INode {
	/**
	 * *Type of NODE*
	 * 
	 * *`"0"` ({@link IFolder}) or `"1"` ({@link IPlaylist})*
	 */
	Type: string
	/** *Name of NODE* */
	Name: string
}

export interface IFolder extends INode {
	Type: "0"
	/** *Number of NODE in the NODE* */
	Count: string
	NODE?: FolderContents
}

type FolderContents = (IFolder | IPlaylist)[]

export interface IPlaylist extends INode {
	Type: "1"
	/** *Number of TRACK in PLAYLIST* */
	Entries: string
	/**
	 * *Kind of identification*
	 * 
	 * *`"0"` ({@link ITrack.TrackID}) or `"1"` ({@link ITrack.Location})*
	 */
	KeyType: "0" | "1"
	TRACK?: ITrackReference[]
}

export interface ITrackReference {
	/**
	 * *Identification of track*
	 * 
	 * *signed 32bit integer **or** utf-8 string*
	 * 
	 * {@link ITrack.TrackID} or {@link ITrack.Location} in {@link ICollection}
	 */
	Key: string
}