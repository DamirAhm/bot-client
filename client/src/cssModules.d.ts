declare module '*.module.css' {
	type module = {
		[key: string]: string;
	};

	const a: module;

	export = a;
}
