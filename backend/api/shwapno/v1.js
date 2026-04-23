const SHWAPNO_PRODUCT_API = "https://www.shwapno.com/api/product";

const DEFAULT_HEADERS = {
	"Content-Type": "application/json",
	accept: "*/*",
	"accept-language": "en-GB,en;q=0.9,en-US;q=0.8,it-IT;q=0.7,it;q=0.6",
	origin: "https://www.shwapno.com",
	referer: "https://www.shwapno.com/egg-loose",
	"sec-ch-ua": '"Microsoft Edge";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
	"user-agent":
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0"
};

export async function getProductById(productId) {
	const response = await fetch(SHWAPNO_PRODUCT_API, {
		method: "POST",
		headers: DEFAULT_HEADERS,
		body: JSON.stringify({ productId })
	});

	if (!response.ok) {
		throw new Error(`Shwapno API request failed: ${response.status}`);
	}

	return response.json();
}
