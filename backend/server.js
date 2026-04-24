import http from "node:http";
import { readdir, readFile } from "node:fs/promises";
import { getProductById as getShwapnoProductById } from "./api/shwapno/v1.js";
import { searchPersonalized } from "./api/chaldal/v1.js";
import { getProductById as getMeenaBazarProductById } from "./api/meenabazar/v1.js";

const PORT = process.env.PORT || 3000;

function sendJson(response, statusCode, body) {
	response.writeHead(statusCode, {
		"Content-Type": "application/json"
		,"Access-Control-Allow-Origin": "*"
		,"Access-Control-Allow-Methods": "GET, OPTIONS"
		,"Access-Control-Allow-Headers": "Content-Type"
	});
	response.end(JSON.stringify(body));
}

function normalizeRoutePath(routePath) {
	return routePath.replace(/^\/+|\/+$/g, "").replace(/^products\/details\//, "products/");
}

async function readJsonFile(relativePath) {
	const fileUrl = new URL(relativePath, import.meta.url);
	const fileContent = await readFile(fileUrl, "utf-8");
	return JSON.parse(fileContent);
}

async function readProductMappingByRoute(routePath) {
	const normalizedPath = normalizeRoutePath(routePath);
	const products = await readJsonFile(`./${normalizedPath}.json`);

	if (!Array.isArray(products)) {
		return [];
	}

	return products;
}

function findChaldalHit(data, objectID) {
	if (!Array.isArray(data?.hits)) {
		return undefined;
	}

	return data.hits.find((item) => String(item?.objectID) === String(objectID));
}

async function readUtilityData() {
	const utilities = await readJsonFile("./products/utility.json");
	return Array.isArray(utilities) ? utilities : [];
}

function toTitleCaseLabel(value) {
	return String(value || "")
		.split(/[-\s]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

async function listProductMappingFiles(directoryPath, prefixPath) {
	const directoryEntries = await readdir(new URL(directoryPath, import.meta.url), { withFileTypes: true });
	const discoveredFiles = [];

	for (const entry of directoryEntries) {
		const entryDirectoryPath = `${directoryPath}/${entry.name}`;
		const entryPrefixPath = `${prefixPath}/${entry.name}`;

		if (entry.isDirectory()) {
			const nestedFiles = await listProductMappingFiles(entryDirectoryPath, entryPrefixPath);
			discoveredFiles.push(...nestedFiles);
			continue;
		}

		if (entry.isFile() && entry.name.endsWith(".json") && entry.name !== "utility.json") {
			discoveredFiles.push(entryPrefixPath);
		}
	}

	return discoveredFiles;
}

function parsePositiveInteger(value, fallback) {
	const parsedValue = Number.parseInt(value, 10);
	return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

function groupCatalogProducts(products) {
	const sectionMap = new Map();

	for (const product of products) {
		const section = sectionMap.get(product.category) || { category: product.category, groups: [] };
		if (!sectionMap.has(product.category)) {
			sectionMap.set(product.category, section);
		}

		let group = section.groups.find((item) => item.name === product.groupName);
		if (!group) {
			group = { name: product.groupName, products: [] };
			section.groups.push(group);
		}

		group.products.push({
			id: product.id,
			name: product.name,
			unit: product.unit,
			productImage: product.productImage,
			route: product.route
		});
	}

	return [...sectionMap.values()];
}

async function readCatalogSections(options = {}) {
	const shouldPaginate = options.paginate === true;
	const page = parsePositiveInteger(options.page, 1);
	const limit = parsePositiveInteger(options.limit, 24);
	const mappingFiles = await listProductMappingFiles("./products", "products");
	const allProducts = [];

	for (const relativePath of mappingFiles) {
		const routeRelativePath = relativePath.replace(/^products\//, "").replace(/\.json$/i, "");
		const pathParts = routeRelativePath.split("/");

		const fileName = pathParts[pathParts.length - 1];
		const categoryRaw = pathParts[0] || "products";
		const groupRaw = pathParts.length > 2 ? pathParts[pathParts.length - 2] : fileName;

		const category = toTitleCaseLabel(categoryRaw);
		const groupName = toTitleCaseLabel(groupRaw);

		const items = await readJsonFile(`./${relativePath}`);
		if (!Array.isArray(items)) {
			continue;
		}

		for (const [index, item] of items.entries()) {
			allProducts.push({
				id: index + 1,
				name: item.productName,
				unit: item.unit,
				productImage: item.productImage,
				route: `/products/details/${routeRelativePath}?id=${index + 1}`,
				category,
				groupName
			});
		}
	}

	if (!shouldPaginate) {
		return groupCatalogProducts(allProducts);
	}

	const totalProducts = allProducts.length;
	const totalPages = Math.max(1, Math.ceil(totalProducts / limit));
	const safePage = Math.min(Math.max(page, 1), totalPages);
	const startIndex = (safePage - 1) * limit;
	const paginatedProducts = allProducts.slice(startIndex, startIndex + limit);

	return {
		page: safePage,
		limit,
		totalProducts,
		totalPages,
		sections: groupCatalogProducts(paginatedProducts)
	};
}

function toNumber(value) {
	const numericValue = Number(value);
	return Number.isFinite(numericValue) ? numericValue : 0;
}

function multiplyPrice(value, factor) {
	return toNumber(value) * toNumber(factor || 1);
}

function transformShwapnoProduct(product, multiplyProductPrice) {
	const priceValue = multiplyPrice(product?.price?.priceValue, multiplyProductPrice);
	const hasOldPriceValue = product?.price?.oldPriceValue !== undefined && product?.price?.oldPriceValue !== null;
	const oldPriceValue = hasOldPriceValue
		? multiplyPrice(product?.price?.oldPriceValue, multiplyProductPrice)
		: priceValue;

	return {
		sku: product?.sku,
		oldPriceValue,
		priceValue,
		discountAmountValue: oldPriceValue - priceValue
	};
}

function transformChaldalProduct(product, multiplyProductPrice) {
	const oldPriceValue = multiplyPrice(product?.mrp, multiplyProductPrice);
	const priceValue = multiplyPrice(product?.price, multiplyProductPrice);

	return {
		sku: product?.objectID,
		oldPriceValue,
		priceValue,
		discountAmountValue: oldPriceValue - priceValue
	};
}

function transformMeenaBazarProduct(product, multiplyProductPrice) {
	const oldPriceValue = multiplyPrice(product?.UnitSalesPrice, multiplyProductPrice);
	const priceValue = multiplyPrice(product?.DiscountSalesPrice, multiplyProductPrice);

	return {
		sku: product?.ItemId,
		oldPriceValue,
		priceValue,
		discountAmountValue: oldPriceValue - priceValue
	};
}

function hasComparablePrice(productItem) {
	return Number.isFinite(Number(productItem?.data?.priceValue));
}

function sortProductItems(products) {
	return [...products].sort((a, b) => {
		const aComparable = hasComparablePrice(a);
		const bComparable = hasComparablePrice(b);

		if (aComparable && !bComparable) {
			return -1;
		}

		if (!aComparable && bComparable) {
			return 1;
		}

		if (!aComparable && !bComparable) {
			return 0;
		}

		const priceDiff = Number(a.data.priceValue) - Number(b.data.priceValue);
		if (priceDiff !== 0) {
			return priceDiff;
		}

		return Number(b.data.discountAmountValue || 0) - Number(a.data.discountAmountValue || 0);
	});
}

function getBestChoice(products) {
	const comparableProducts = products.filter(hasComparablePrice);

	if (comparableProducts.length === 0) {
		return "Pick Nearest";
	}

	const firstPrice = Number(comparableProducts[0].data.priceValue);
	const areAllPricesSame = comparableProducts.every((item) => Number(item.data.priceValue) === firstPrice);

	if (areAllPricesSame) {
		return "Pick Nearest";
	}

	return comparableProducts[0].source;
}

const server = http.createServer(async (request, response) => {
	if (request.method === "OPTIONS") {
		response.writeHead(204, {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type"
		});
		response.end();
		return;
	}

	if (request.method !== "GET") {
		sendJson(response, 405, {
			error: "Method not allowed"
		});
		return;
	}

	const url = new URL(request.url, `http://${request.headers.host}`);
	const shwapnoMatch = url.pathname.match(/^\/api\/shwapno\/([^/]+)$/);
	const meenabazarMatch = url.pathname.match(/^\/api\/meenabazar\/product\/([^/]+)$/);

	if (shwapnoMatch) {
		const productId = decodeURIComponent(shwapnoMatch[1]);

		try {
			const data = await getShwapnoProductById(productId);
			sendJson(response, 200, data);
		} catch (error) {
			sendJson(response, 502, {
				error: "Failed to fetch product from Shwapno",
				message: error instanceof Error ? error.message : "Unknown error"
			});
		}
		return;
	}

	if (meenabazarMatch) {
		const productId = decodeURIComponent(meenabazarMatch[1]);

		try {
			const data = await getMeenaBazarProductById(productId);
			sendJson(response, 200, data);
		} catch (error) {
			sendJson(response, 502, {
				error: "Failed to fetch product from Meena Bazar",
				message: error instanceof Error ? error.message : "Unknown error"
			});
		}
		return;
	}

	if (url.pathname === "/api/utilities") {
		try {
			const utilities = await readUtilityData();
			sendJson(response, 200, utilities);
		} catch (error) {
			sendJson(response, 500, {
				error: "Failed to load utility data",
				message: error instanceof Error ? error.message : "Unknown error"
			});
		}
		return;
	}

	if (url.pathname === "/api/catalog") {
		try {
			const page = url.searchParams.get("page");
			const limit = url.searchParams.get("limit");
			const shouldPaginate = page !== null || limit !== null;
			const catalog = await readCatalogSections({ page, limit, paginate: shouldPaginate });
			sendJson(response, 200, catalog);
		} catch (error) {
			sendJson(response, 500, {
				error: "Failed to load catalog",
				message: error instanceof Error ? error.message : "Unknown error"
			});
		}
		return;
	}

	if (url.pathname === "/api/chaldal" || url.pathname === "/api/chaldal/") {
		const categoryId = url.searchParams.get("category") || "61";
		const pageIndex = Number(url.searchParams.get("page") || 0);
		const objectIdParam = url.searchParams.get("objectID");

		try {
			const data = await searchPersonalized({
				currentPageIndex: Number.isNaN(pageIndex) ? 0 : pageIndex,
				filters: [`categories%3D${categoryId}`]
			});

			if (objectIdParam) {
				const hit = Array.isArray(data?.hits)
					? data.hits.find((item) => String(item?.objectID) === objectIdParam)
					: undefined;

				if (!hit) {
					sendJson(response, 404, {
						error: "Product not found for objectID",
						objectID: objectIdParam
					});
					return;
				}

				sendJson(response, 200, hit);
				return;
			}

			sendJson(response, 200, data);
		} catch (error) {
			sendJson(response, 502, {
				error: "Failed to fetch products from Chaldal",
				message: error instanceof Error ? error.message : "Unknown error"
			});
		}
		return;
	}

	if (url.pathname.startsWith("/products/details/") && url.pathname.endsWith(".json") === false) {
		const idParam = url.searchParams.get("id");

		if (!idParam) {
			sendJson(response, 400, {
				error: "Missing required query param: id"
			});
			return;
		}

		try {
			const configList = await readProductMappingByRoute(url.pathname);
			const productIndex = Number.parseInt(idParam, 10);
			const arrayIndex = Number.isInteger(productIndex) && productIndex > 0 ? productIndex - 1 : -1;
			const config = arrayIndex >= 0 ? configList[arrayIndex] : undefined;

			if (!config) {
				sendJson(response, 404, {
					error: "Product mapping not found",
					path: url.pathname,
					id: idParam
				});
				return;
			}

			const shwapnoProductId = config?.shwapno?.shwapnoProductId;
			const shwapnoMultiplyProductPrice = config?.shwapno?.multiplyProductPrice ?? 1;
			const chaldalCategoryId = config?.chaldal?.chaldalCategories;
			const chaldalObjectID = config?.chaldal?.chaldalObjectID;
			const chaldalMultiplyProductPrice = config?.chaldal?.multiplyProductPrice ?? 1;
			const meenaBazarProductId = config?.meenabazar?.meenabazarProductId;
			const meenaBazarMultiplyProductPrice = config?.meenabazar?.multiplyProductPrice ?? 1;

			const [shwapnoResult, chaldalResult, meenaBazarResult] = await Promise.allSettled([
				getShwapnoProductById(shwapnoProductId),
				searchPersonalized({
					currentPageIndex: 0,
					filters: [`categories%3D${chaldalCategoryId}`]
				}),
				meenaBazarProductId ? getMeenaBazarProductById(meenaBazarProductId) : Promise.resolve(null)
			]);

			const products = [];

			if (shwapnoResult.status === "fulfilled") {
				products.push({
					source: "shwapno",
					data: transformShwapnoProduct(shwapnoResult.value, shwapnoMultiplyProductPrice)
				});
			} else {
				products.push({
					source: "shwapno",
					error: "Failed to fetch product",
					message: shwapnoResult.reason?.message || "Unknown error"
				});
			}

			if (chaldalResult.status === "fulfilled") {
				const chaldalProduct = findChaldalHit(chaldalResult.value, chaldalObjectID);

				if (chaldalProduct) {
					products.push({
						source: "chaldal",
						data: transformChaldalProduct(chaldalProduct, chaldalMultiplyProductPrice)
					});
				} else {
					products.push({
						source: "chaldal",
						error: "Product not found for objectID",
						objectID: chaldalObjectID
					});
				}
			} else {
				products.push({
					source: "chaldal",
					error: "Failed to fetch product list",
					message: chaldalResult.reason?.message || "Unknown error"
				});
			}

			if (!meenaBazarProductId) {
				products.push({
					source: "meenabazar",
					error: "Missing Meena Bazar product mapping"
				});
			} else if (meenaBazarResult.status === "fulfilled") {
				const meenaBazarProduct = meenaBazarResult.value?.data?.product;

				if (meenaBazarProduct) {
					products.push({
						source: "meenabazar",
						data: transformMeenaBazarProduct(meenaBazarProduct, meenaBazarMultiplyProductPrice)
					});
				} else {
					products.push({
						source: "meenabazar",
						error: "Product not found in response"
					});
				}
			} else {
				products.push({
					source: "meenabazar",
					error: "Failed to fetch product",
					message: meenaBazarResult.reason?.message || "Unknown error"
				});
			}

			const sortedProducts = sortProductItems(products);
			const bestChoice = getBestChoice(sortedProducts);

			sendJson(response, 200, {
				id: productIndex,
				productName: config.productName,
				unit: config.unit,
				productImage: config.productImage,
				"best-choice": bestChoice,
				products: sortedProducts
			});
		} catch (error) {
			if (error instanceof Error && "code" in error && error.code === "ENOENT") {
				sendJson(response, 404, {
					error: "Product mapping file not found",
					path: url.pathname
				});
				return;
			}

			sendJson(response, 500, {
				error: "Failed to load product mapping",
				message: error instanceof Error ? error.message : "Unknown error"
			});
		}
		return;
	}

	if (url.pathname.startsWith("/products/") && url.pathname.endsWith(".json") === false) {
		const idParam = url.searchParams.get("id");

		if (!idParam) {
			sendJson(response, 400, {
				error: "Missing required query param: id"
			});
			return;
		}

		try {
			const configList = await readProductMappingByRoute(url.pathname);
			const productIndex = Number.parseInt(idParam, 10);
			const arrayIndex = Number.isInteger(productIndex) && productIndex > 0 ? productIndex - 1 : -1;
			const config = arrayIndex >= 0 ? configList[arrayIndex] : undefined;

			if (!config) {
				sendJson(response, 404, {
					error: "Product mapping not found",
					path: url.pathname,
					id: idParam
				});
				return;
			}

			const shwapnoProductId = config?.shwapno?.shwapnoProductId;
			const chaldalCategoryId = config?.chaldal?.chaldalCategories;
			const chaldalObjectID = config?.chaldal?.chaldalObjectID;
			const meenaBazarProductId = config?.meenabazar?.meenabazarProductId;

			const [shwapnoResult, chaldalResult, meenaBazarResult] = await Promise.allSettled([
				getShwapnoProductById(shwapnoProductId),
				searchPersonalized({
					currentPageIndex: 0,
					filters: [`categories%3D${chaldalCategoryId}`]
				}),
				meenaBazarProductId ? getMeenaBazarProductById(meenaBazarProductId) : Promise.resolve(null)
			]);

			const products = [];

			if (shwapnoResult.status === "fulfilled") {
				products.push({
					source: "shwapno",
					data: shwapnoResult.value
				});
			} else {
				products.push({
					source: "shwapno",
					error: "Failed to fetch product",
					message: shwapnoResult.reason?.message || "Unknown error"
				});
			}

			if (chaldalResult.status === "fulfilled") {
				const chaldalProduct = findChaldalHit(chaldalResult.value, chaldalObjectID);

				if (chaldalProduct) {
					products.push({
						source: "chaldal",
						data: chaldalProduct
					});
				} else {
					products.push({
						source: "chaldal",
						error: "Product not found for objectID",
						objectID: chaldalObjectID
					});
				}
			} else {
				products.push({
					source: "chaldal",
					error: "Failed to fetch product list",
					message: chaldalResult.reason?.message || "Unknown error"
				});
			}

			if (!meenaBazarProductId) {
				products.push({
					source: "meenabazar",
					error: "Missing Meena Bazar product mapping"
				});
			} else if (meenaBazarResult.status === "fulfilled") {
				products.push({
					source: "meenabazar",
					data: meenaBazarResult.value
				});
			} else {
				products.push({
					source: "meenabazar",
					error: "Failed to fetch product",
					message: meenaBazarResult.reason?.message || "Unknown error"
				});
			}

			sendJson(response, 200, {
				id: productIndex,
				productName: config.productName,
				unit: config.unit,
				products
			});
		} catch (error) {
			if (error instanceof Error && "code" in error && error.code === "ENOENT") {
				sendJson(response, 404, {
					error: "Product mapping file not found",
					path: url.pathname
				});
				return;
			}

			sendJson(response, 500, {
				error: "Failed to load product mapping",
				message: error instanceof Error ? error.message : "Unknown error"
			});
		}
		return;
	}

	sendJson(response, 404, {
		error: "Route not found"
	});
});

server.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
