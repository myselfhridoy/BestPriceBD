# Backend (ES Module)

This backend is configured to use JavaScript ES Modules in Node.js.

## Scripts

- `npm start` - Run `server.js`
- `npm run dev` - Run with Node watch mode

## Notes

- `"type": "module"` in `package.json` enables ESM syntax for `.js` files.
- Use `import` / `export` instead of `require` / `module.exports`.

## Add New Super Shop API and Route

This project supports a plug-in style for adding new shop sources (like Shwapno, Chaldal, Meena Bazar).

### 1. Create API Client File

Create a new file under api folder:

- Example path: ./api/newshop/v1.js

Recommended export pattern:

- Export one main function named getProductById or searchProducts (based on the shop API)
- Throw error when response status is not OK
- Return parsed JSON

### 2. Import API in Server

In ./server.js, import with alias to avoid naming conflicts:

- Example: import { getProductById as getNewShopProductById } from "./api/newshop/v1.js";

### 3. Add Transform Function (Normalization)

Add a transform function in ./server.js so every source uses same output shape:

- sku
- oldPriceValue
- priceValue
- discountAmountValue

Formula convention used in this project:

- oldPriceValue = source old/regular price x multiplyProductPrice
- priceValue = source sale/discount price x multiplyProductPrice
- discountAmountValue = oldPriceValue - priceValue

### 4. Add Direct Shop Route

Add a direct test route in ./server.js:

- Example route: /api/newshop/product/:id

This is useful for quick debugging before combining with other sources.

### 5. Add Product Mapping in Products JSON

In product mapping files under ./products/**, add new shop config block.

Example shape:

- newshop.newshopProductId
- newshop.multiplyProductPrice

Also keep existing shop mappings unchanged.

### 6. Add Shop to Combined Details Route

In /products/details/... handler inside ./server.js:

- Read new shop mapping from config
- Add new API call into Promise.allSettled
- Push source result into products array with source name
- On success push normalized data
- On failure push error object for that source

After that existing sortProductItems and getBestChoice logic will continue to work.

### 7. Add Shop Icon

Add icon entry in:

- ./products/utility.json

Example fields:

- name
- icon

Frontend reads this file via /api/utilities.

### 8. Quick Testing Checklist

1. Test direct route: /api/newshop/product/:id
2. Test combined route: /products/details/... ?id=...
3. Confirm products array contains new source
4. Confirm price fields are numbers and discount is calculated correctly
5. Confirm icon appears in frontend comparison modal
