import * as path from "path";
import * as fs from "fs/promises";

export const isSameFilepath = (pathA: string, pathB: string): boolean => {
	const normalisedA = path.normalize(pathA);
	const normalisedB = path.normalize(pathB);
	const superNormalisedA = normalisedA.trim().toLowerCase();
	const superNormalisedB = normalisedB.trim().toLowerCase();
	return superNormalisedA === superNormalisedB;
};

export const addSafe = <T>(set: Set<T>, item: T): void => {
	if (set.has(item)) {
		throw new Error("new item already exists in set");
	}

	set.add(item);
};

export const decodeRekordboxLocation = (rekordboxLocation: string): string => {
	const result = /^file:\/\/localhost\/(.+)$/.exec(rekordboxLocation);

	if (result === null) {
		throw new Error(`Invalid path: ${JSON.stringify(rekordboxLocation)}`);
	}

	return decodeURIComponent(result[1]);
};

export const existsOnFs = async (path: string): Promise<boolean> => {
	try {
		await fs.access(path);
		return true;
	} catch {
		return false;
	}
};

export const removeSafe = <T>(set: Set<T>, item: T): void => {
	if (!set.has(item)) {
		throw new Error("can't remove item, doesn't exist in set");
	}

	set.delete(item);
};

export const limitText = (text: string, length: number): string => {
	if (text.length <= length) {
		return text;
	}

	return text.slice(0, Math.max(length, 0)) + "...";
};

type IsPreciselyString<T> = [T] extends [string]
	? [string] extends [T]
		? true
		: false
	: false;

export type Loosen<T extends {}> = {
	[k in keyof T]: IsPreciselyString<T[k]> extends true
		? string | number | boolean
		: Loosen<T[k]>;
};

export interface XMLSerializable<T> {
	serialize: () => Loosen<T>;
}

export const dateToRekordbox = (date: Date): string =>
	date.toISOString().split("T")[0];

export const rekordboxToDate = (rbDate: string): Date => new Date(rbDate);

export interface CueColor {
	red: number;
	green: number;
	blue: number;
}

export const numToHotCueChar = (num: number): string => {
	if (num < 0 || num > 7) {
		throw new Error("Number param out of bounds");
	}

	return String.fromCharCode(num + 65);
};

export const hotCueCharToNum = (char: string): number => {
	if (char.length > 1) {
		throw new Error("Char param longer than 1");
	}

	const num = char.charCodeAt(0) - 65;

	if (num < 0 || num > 7) {
		throw new Error("Char param out of bounds");
	}

	return num;
};

export const asyncFilter = async <T>(
	arr: T[],
	predicate: (value: T, index: number, array: T[]) => Promise<unknown>
) => {
	const results = await asyncMap(arr, predicate);
	return arr.filter((_v, index) => results[index]);
};

export const asyncMap = async <T, U>(
	arr: T[],
	callbackFn: (value: T, index: number, array: T[]) => Promise<U>
) => {
	const promises = arr.map(callbackFn);
	return await Promise.all(promises);
};

export const isBetween = (
	number: number,
	boundaryA: number,
	boundaryB: number
): boolean => {
	const min = Math.min(boundaryA, boundaryB);
	const max = Math.max(boundaryA, boundaryB);
	return number > min && number < max;
};
