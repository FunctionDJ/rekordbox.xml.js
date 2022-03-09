import { performance } from "perf_hooks";

const take = (startTime: number): string => {
	const time = performance.now() - startTime;
	return time.toFixed(2);
};

export const measureDecorator = (
	_target: Object,
	propertyKey: string,
	descriptor: PropertyDescriptor
): PropertyDescriptor => {
	const originalMethod = descriptor.value;

	descriptor.value = function (...args: any[]) {
		const start = performance.now();
		const result = originalMethod.apply(this, args);
		console.log(`[Measurement of ${propertyKey}]: ${take(start)}ms`);
		return result;
	};

	return descriptor;
};

export const measureSync = <T>(callback: () => T): [string, T] => {
	const start = performance.now();
	const result = callback();
	return [take(start), result];
};

export const measure = async <T>(callback: () => T): Promise<[string, Awaited<T>]> => {
	const start = performance.now();
	const result = await callback();
	return [take(start), result];
};

export const partition = <T>(arr: T[], test: (item: T) => boolean): [T[], T[]] => (
	arr.reduce<[T[], T[]]>((prev, cur) => {
		const result = test(cur);
		if (result) {
			prev[0].push(cur);
		} else {
			prev[1].push(cur);
		}
		return prev;
	}, [[], []])
);
