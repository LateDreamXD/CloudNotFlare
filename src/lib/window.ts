export const open = (url: string, size?: {width: number, height: number}, centered?: boolean) => {
	const left = centered ? (screen.availWidth - (size?.width || 800)) / 2 : 0;
	const top = centered ? (screen.availHeight - (size?.height || 600)) / 2 : 0;
	window.open(url, '_blank', `width=${size?.width || 800},height=${size?.height || 600},left=${left},top=${top}`);
}

export default {
	open
}
