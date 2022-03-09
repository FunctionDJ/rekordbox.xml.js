import { IRootFolder } from "./nodes";
import { ITrack } from "./tracks";

/**
 * Italic annotations are taken from the PDF: https://cdn.rekordbox.com/files/20200410160904/xml_format_list.pdf
 *
 * *- all `string` fields are encoded using UTF8 encoding, with XML entities encoded (&, <, >, ' and ")*
 *
 * *- numeric fields are encoded using integer or floating point values, which should be 'locale' independent (no space between digits, dot or comma decimal separator for floating point (e.g. `"321453.16312"`) )*
 *
 * *- {@link ITrack.Location} field is encoded as an URI; expected media to be located in `file://localhost/`*
 */
export interface RekordboxXML {
	DJ_PLAYLISTS: IDJ_PLAYLISTS
}

export interface IDJ_PLAYLISTS {
	/** The latest version is 1.0.0 */
	Version: string
	PRODUCT: IProduct
	/**
	 * From the PDF: *The informations of the tracks who are not included in any playlist are unnecessary*
	 *
	 * No idea what this means. Tracks outside any playlists are still part of the collection and can be imported.
	 *
	 * They actually must be imported if the XML import bug is present for the tags, cues and grids to be updated.
	 */
	COLLECTION: ICollection
	PLAYLISTS: IPlaylists
}

export interface IProduct {
	/**
	 * *Name of product*
	 *
	 * *This name will be displayed in each application software*
	 */
	Name: string
	/** *Version of application* */
	Version: string
	/** *Name of company* */
	Company: string
}

export interface ICollection {
	/** *Number of TRACK in COLLECTION* */
	Entries: string
	TRACK?: ITrack[]
}

export interface IPlaylists {
	/** *Root folder* */
	NODE: IRootFolder
}
