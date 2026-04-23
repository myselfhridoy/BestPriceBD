const MEENABAZAR_PRODUCT_API = "https://mbonlineapi.com/api/front/products";

const DEFAULT_HEADERS = {
	accept: "application/json",
	"accept-language": "en-GB,en;q=0.9,en-US;q=0.8",
	origin: "https://meenabazaronline.com",
	referer: "https://meenabazaronline.com/",
	"user-agent":
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36"
};

export const DEFAULT_SUB_UNIT_ID = 1075;

export function removeRelatedProducts(payload) {
	if (!payload || typeof payload !== "object") {
		return payload;
	}

	const data = payload.data && typeof payload.data === "object" ? payload.data : {};

	return {
		...payload,
		data: {
			product: data.product || null
		}
	};
}

export async function getProductById(productId) {
	if (!productId) {
		throw new Error("Meena Bazar productId is required");
	}

	const url = new URL(`${MEENABAZAR_PRODUCT_API}/${encodeURIComponent(String(productId))}`);
	url.searchParams.set("SubUnitId", String(DEFAULT_SUB_UNIT_ID));

	const response = await fetch(url, {
		method: "GET",
		headers: DEFAULT_HEADERS
	});

	if (!response.ok) {
		throw new Error(`Meena Bazar API request failed: ${response.status}`);
	}

	const data = await response.json();
	return removeRelatedProducts(data);
}
