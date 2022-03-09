import { Library } from "./rekordbox/core/library";

interface RXScriptReturnsUndefined {
	run: (library: Library) => Promise<undefined>
	/**
	 * The purpose of this value is that the user immediately
	 * gets notified if they forgot to specify an output file
	 * instead of waiting for the script to finish processing.
	 */
	returnsLibrary: false
}

interface RXScriptReturnsLibrary {
	run: (library: Library) => Promise<Library>
	/**
	 * The purpose of this value is that the user immediately
	 * gets notified if they forgot to specify an output file
	 * instead of waiting for the script to finish processing.
	 */
	returnsLibrary: true
}

export type RXScript = RXScriptReturnsUndefined | RXScriptReturnsLibrary;
