const CHALDAL_SEARCH_API = "https://catalog.chaldal.com/searchPersonalized";

const DEFAULT_HEADERS = {
	"Content-Type": "application/json",
	accept: "application/json",
	"accept-language": "en-GB,en;q=0.9,en-US;q=0.8,it-IT;q=0.7,it;q=0.6",
	origin: "https://chaldal.com",
	referer: "https://chaldal.com/",
	"sec-ch-ua": '"Microsoft Edge";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
	"user-agent":
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0"
};

const DEFAULT_PAYLOAD = {
	apiKey: "e964fc2d51064efa97e94db7c64bf3d044279d4ed0ad4bdd9dce89fecc9156f0",
	storeId: 1,
	warehouseId: 9,
	pageSize: 100,
	currentPageIndex: 0,
	metropolitanAreaId: 1,
	query: "",
	productVariantId: -1,
	bundleId: {
		case: "None"
	},
	canSeeOutOfStock: "false",
	filters: ["categories%3D61"],
	maxOutOfStockCount: {
		case: "Some",
		fields: [0]
	},
	shouldShowAlternateProductsForAllOutOfStock: {
		case: "Some",
		fields: ["false"]
	},
	customerGuid: {
		case: "None"
	},
	deliveryAreaId: {
		case: "None"
	},
	shouldShowCategoryBasedRecommendations: {
		case: "None"
	}
};

export async function searchPersonalized(overrides = {}) {
	const payload = {
		...DEFAULT_PAYLOAD,
		...overrides
	};

	const response = await fetch(CHALDAL_SEARCH_API, {
		method: "POST",
		headers: DEFAULT_HEADERS,
		body: JSON.stringify(payload)
	});

	if (!response.ok) {
		throw new Error(`Chaldal API request failed: ${response.status}`);
	}

	return response.json();
}
