import { describe, expect, it, vi } from "vitest";
import { ApiClientConfig } from "@/lib/api/config";
import { Result } from "@/lib/api/contracts";
import { createApiServices } from "@/lib/api/production-services";
import { createMockServices } from "@/lib/services/mock-services";
import { JsonApiClient } from "@/lib/api/http-client";
import {
  buildCatalogMediaForm,
  catalogNativeFilePart,
  catalogUploadIssue,
  isDeviceFileUri,
  isSupportedCatalogueImage,
} from "@/lib/api/catalog-media";

vi.mock("@/lib/api/config", () => ({ apiConfig: { mode: "mock-local", baseUrl: "", timeoutMs: 1000, versionPrefix: "/api/v1", allowInsecureHttp: false } }));

const config: ApiClientConfig = { mode: "api", baseUrl: "https://api.example.test", timeoutMs: 1000, versionPrefix: "/api/v1", allowInsecureHttp: false };
const success = <T,>(data: T): Result<T> => ({ ok: true, source: "api", data, requestId: "catalog-test" });

type Call = { method: string; path: string; value?: unknown; options?: unknown };
function clientWith(handlers: {
  get?: (path: string, options?: unknown) => Promise<Result<unknown>>;
  put?: (path: string, body?: unknown, options?: unknown) => Promise<Result<unknown>>;
  post?: (path: string, body?: unknown, options?: unknown) => Promise<Result<unknown>>;
  patch?: (path: string, body?: unknown, options?: unknown) => Promise<Result<unknown>>;
  delete?: (path: string, options?: unknown) => Promise<Result<unknown>>;
} = {}, calls: Call[] = []) {
  return {
    get: vi.fn(async (path: string, options?: unknown) => { calls.push({ method: "GET", path, options }); return handlers.get ? handlers.get(path, options) : success({ items: [], total: 0, page: 1, pageSize: 20 }); }),
    put: vi.fn(async (path: string, body?: unknown, options?: unknown) => { calls.push({ method: "PUT", path, value: body, options }); return handlers.put ? handlers.put(path, body, options) : success(itemDto({ media: [] })); }),
    post: vi.fn(async (path: string, body?: unknown, options?: unknown) => { calls.push({ method: "POST", path, value: body, options }); return handlers.post ? handlers.post(path, body, options) : success(itemDto({})); }),
    patch: vi.fn(async (path: string, body?: unknown, options?: unknown) => { calls.push({ method: "PATCH", path, value: body, options }); return handlers.patch ? handlers.patch(path, body, options) : success(itemDto({})); }),
    delete: vi.fn(async (path: string, options?: unknown) => { calls.push({ method: "DELETE", path, options }); return handlers.delete ? handlers.delete(path, options) : success(undefined); }),
  } as unknown as JsonApiClient;
}

/** A full CatalogItem response with media ordered out of sequence, so ordering has to be proven. */
function itemDto(overrides: Record<string, unknown> = {}) {
  return {
    id: "item-1", businessId: "biz-1", businessName: "Amani Textiles", businessSlug: "amani-textiles", kind: "product",
    title: "Handwoven basket", slug: "handwoven-basket", description: "A durable handwoven storage basket.", category: "Craft",
    subcategory: "Baskets", priceKsh: 1500, priceNote: "", currency: "KES", priceNegotiable: false, sku: "BK-01",
    stockQuantity: 4, inStock: true, unit: "piece", availabilityStatus: "available", leadTimeDays: null, durationMinutes: null,
    serviceAreas: [], visitType: null, status: "published", isPublished: true, attributes: {},
    media: [
      { mediaAssetId: "m2", sortOrder: 1, altText: "Side view", accessUrl: "/api/v1/media/m2/content", contentType: "image/png", sizeBytes: 2048, widthPx: null, heightPx: null, provider: "s3" },
      { mediaAssetId: "m1", sortOrder: 0, altText: "Front view", accessUrl: "/api/v1/media/m1/content", contentType: "image/jpeg", sizeBytes: 1024, widthPx: null, heightPx: null, provider: "local" },
    ],
    createdAt: "2026-11-01T10:00:00Z", updatedAt: "2026-11-10T10:00:00Z", publishedAt: "2026-11-02T10:00:00Z",
    archivedAt: null, currentUserRole: "Owner", ...overrides,
  };
}

function publicItemDto(overrides: Record<string, unknown> = {}) {
  return {
    id: "item-9", kind: "product", title: "Kanga wrap", slug: "kanga-wrap", summary: "A printed cotton kanga.", category: "Clothing",
    subcategory: "", priceKsh: null, priceNote: "Price on request", currency: "KES", priceNegotiable: true, sku: null,
    inStock: null, availabilityStatus: "available", durationMinutes: null, visitType: null,
    media: [{ mediaAssetId: "m9", sortOrder: 0, altText: "", accessUrl: "/api/v1/media/m9/content", contentType: "image/webp", sizeBytes: 512, widthPx: null, heightPx: null, provider: "local" }],
    businessId: "biz-9", businessName: "Nairobi Threads", businessSlug: "nairobi-threads", county: "Nairobi", town: "Westlands",
    publishedAt: "2026-11-03T10:00:00Z", updatedAt: "2026-11-09T10:00:00Z", ...overrides,
  };
}

const DEVICE_URI_PATTERN = /file:|content:|blob:|asset:|seed-images/i;

describe("Stage 5 catalogue API adapters", () => {
  it("uses the exact management routes for products and services", async () => {
    const calls: Call[] = [];
    const services = createApiServices({ config, client: clientWith({}, calls) });
    await services.catalog.listProducts("biz/1", { limit: 20 });
    await services.catalog.getProduct("biz-1", "item-1");
    await services.catalog.createProduct("biz-1", { name: "Basket", description: "Woven basket", price: 1500, availability: "Available", location: "", category: "Craft" });
    await services.catalog.updateProduct("biz-1", "item-1", { name: "Basket" });
    await services.catalog.deleteProduct("biz-1", "item-1");
    await services.catalog.listServices("biz-1", { limit: 20 });
    await services.catalog.getService("biz-1", "item-2");
    await services.catalog.createService("biz-1", { name: "Tailoring", description: "Made to measure tailoring", priceLabel: "KSh 800", location: "", category: "Services" });
    await services.catalog.updateService("biz-1", "item-2", { name: "Tailoring" });
    await services.catalog.deleteService("biz-1", "item-2");

    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual([
      "GET /businesses/biz%2F1/products",
      "GET /businesses/biz-1/products/item-1",
      "POST /businesses/biz-1/products",
      "PATCH /businesses/biz-1/products/item-1",
      "DELETE /businesses/biz-1/products/item-1",
      "GET /businesses/biz-1/services",
      "GET /businesses/biz-1/services/item-2",
      "POST /businesses/biz-1/services",
      "PATCH /businesses/biz-1/services/item-2",
      "DELETE /businesses/biz-1/services/item-2",
    ]);
  });

  it("calls the status, gallery, media and public discovery routes with offset paging", async () => {
    const calls: Call[] = [];
    const services = createApiServices({ config, client: clientWith({}, calls) });
    await services.catalog.setProductStatus("biz-1", "item-1", "published");
    await services.catalog.setServiceStatus("biz-1", "item-2", "archived");
    await services.catalog.replaceProductGallery("biz-1", "item-1", [{ mediaAssetId: "m1", altText: "Front" }, { mediaAssetId: "m2" }]);
    await services.catalog.replaceServiceGallery("biz-1", "item-2", [{ mediaAssetId: "m3", altText: "Kit" }]);
    await services.catalog.listProducts("biz-1", { limit: 20, cursor: "40", search: "  basket  ", status: "draft" });
    await services.catalog.listServices("biz-1", { limit: 20, cursor: "20", status: "archived" });
    await services.catalog.listPublicProducts({ limit: 20, cursor: "0", search: "kanga", category: "Clothing", county: "Nairobi", town: "Westlands", minPrice: 100, maxPrice: 5000, sort: "price_asc" });
    await services.catalog.listPublicServices({ limit: 10, availability: "seasonal", sort: "title" });
    await services.catalog.getPublicProduct("kanga-wrap");
    await services.catalog.getPublicService("item-2");

    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual([
      "POST /businesses/biz-1/products/item-1/status",
      "POST /businesses/biz-1/services/item-2/status",
      "PUT /businesses/biz-1/products/item-1/media",
      "PUT /businesses/biz-1/services/item-2/media",
      "GET /businesses/biz-1/products",
      "GET /businesses/biz-1/services",
      "GET /catalogue/products",
      "GET /catalogue/services",
      "GET /catalogue/products/kanga-wrap",
      "GET /catalogue/services/item-2",
    ]);
    expect(calls[0]?.value).toEqual({ status: "published" });
    expect(calls[1]?.value).toEqual({ status: "archived" });
    expect(calls[2]?.value).toEqual({ mediaAssetIds: ["m1", "m2"], altTexts: ["Front", ""] });
    expect(calls[3]?.value).toEqual({ mediaAssetIds: ["m3"], altTexts: ["Kit"] });
    expect(calls[4]?.options).toEqual({ query: { status: "draft", search: "basket", page: 3, pageSize: 20 } });
    expect(calls[5]?.options).toEqual({ query: { status: "archived", search: undefined, page: 2, pageSize: 20 } });
    expect(calls[6]?.options).toEqual({
      query: { search: "kanga", category: "Clothing", county: "Nairobi", town: "Westlands", minPrice: 100, maxPrice: 5000, sort: "price_asc", availability: undefined, page: 1, pageSize: 20 },
      authenticated: false,
    });
    expect(calls[7]?.options).toEqual({
      query: { search: undefined, category: undefined, county: undefined, town: undefined, minPrice: undefined, maxPrice: undefined, sort: "title", availability: "seasonal", page: 1, pageSize: 10 },
      authenticated: false,
    });
    expect(calls[8]?.options).toEqual({ authenticated: false });
    expect(calls[9]?.options).toEqual({ authenticated: false });
  });

  it("maps a managed product DTO to the domain shape with an ordered gallery and absolute image URLs", async () => {
    const services = createApiServices({ config, client: clientWith({ get: async () => success(itemDto({})) }) });
    const result = await services.catalog.getProduct("biz-1", "item-1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const product = result.data;
    expect(product).toMatchObject({
      id: "item-1", businessId: "biz-1", name: "Handwoven basket", description: "A durable handwoven storage basket.",
      price: 1500, priceKsh: 1500, priceNote: undefined, priceNegotiable: false, sku: "BK-01", stockQuantity: 4, inStock: true,
      unit: "piece", availability: "Available", availabilityStatus: "available", status: "published", archived: false,
      publishedAt: "2026-11-02T10:00:00Z", updatedAt: "2026-11-10T10:00:00Z", slug: "handwoven-basket",
      businessName: "Amani Textiles", category: "Craft",
    });
    expect(product.gallery?.map((entry) => entry.mediaAssetId)).toEqual(["m1", "m2"]);
    expect(product.gallery?.[0]).toMatchObject({
      sortOrder: 0, altText: "Front view", contentType: "image/jpeg", sizeBytes: 1024, provider: "local", widthPx: null,
      url: "https://api.example.test/api/v1/media/m1/content",
    });
    expect(product.gallery?.[1]?.url).toBe("https://api.example.test/api/v1/media/m2/content");
    expect(product.image).toBe("https://api.example.test/api/v1/media/m1/content");
    expect(product.images).toEqual(["https://api.example.test/api/v1/media/m1/content", "https://api.example.test/api/v1/media/m2/content"]);
  });

  it("maps null price, null sku, null visitType and missing service areas without inventing values", async () => {
    const services = createApiServices({ config, client: clientWith({
      get: async (path) => success(path.includes("/services")
        ? itemDto({ kind: "service", priceKsh: null, priceNote: "Hourly rate", priceNegotiable: false, sku: null, stockQuantity: null, inStock: null, unit: null, availabilityStatus: "on_request", durationMinutes: 60, leadTimeDays: 3, visitType: null, serviceAreas: null, status: "draft", publishedAt: null, media: [] })
        : publicItemDto({ priceKsh: null, priceNote: "Price on request", priceNegotiable: true, sku: null, inStock: null, serviceAreas: undefined })),
    }) });

    const service = await services.catalog.getService("biz-1", "item-2");
    expect(service.ok).toBe(true);
    if (service.ok) {
      expect(service.data).toMatchObject({
        priceKsh: null, priceNote: "Hourly rate", priceLabel: "Hourly rate", availability: "On request",
        availabilityStatus: "on_request", durationMinutes: 60, leadTimeDays: 3, visitType: undefined, serviceAreas: undefined,
        status: "draft", archived: false, publishedAt: undefined, gallery: [], images: [],
      });
      // The server never carries a SKU for a service, so the mapper leaves the key out entirely.
      expect(service.data.sku).toBeUndefined();
    }

    const publicItem = await services.catalog.getPublicProduct("kanga-wrap");
    expect(publicItem.ok).toBe(true);
    if (publicItem.ok) {
      expect(publicItem.data).toMatchObject({
        id: "item-9", name: "Kanga wrap", description: "A printed cotton kanga.", priceKsh: null, priceNegotiable: true,
        sku: undefined, inStock: undefined, status: "published", unit: undefined, stockQuantity: undefined,
        businessName: "Nairobi Threads", location: "Westlands, Nairobi",
      });
      expect(publicItem.data.gallery?.[0]?.url).toBe("https://api.example.test/api/v1/media/m9/content");
    }
  });

  it("builds kind-correct payloads and never sends device file references", async () => {
    const calls: Call[] = [];
    const services = createApiServices({ config, client: clientWith({}, calls) });
    const product = await services.catalog.createProduct("biz-1", {
      name: "  Handwoven basket ", description: "  Woven in Kiambu ", category: " Craft ", price: 1500,
      priceKsh: 1500, priceNote: "", priceNegotiable: false, sku: " bk-01 ", stockQuantity: 4, inStock: true, unit: "piece",
      availability: "Available", location: "Kiambu", image: "file:///var/mobile/basket.jpg",
      images: ["content://media/external/images/1", "blob:https://app.test/preview"],
      gallery: [
        { mediaAssetId: "m1", url: "file:///var/mobile/m1.jpg", sortOrder: 0, altText: "Front view", contentType: "image/jpeg", sizeBytes: 10, provider: "local" },
        { mediaAssetId: "", url: "content://media/2", sortOrder: 1, altText: "", contentType: "image/jpeg", sizeBytes: 10, provider: "local" },
        { mediaAssetId: "m1", url: "", sortOrder: 2, altText: "", contentType: "image/jpeg", sizeBytes: 10, provider: "local" },
      ],
    });
    expect(product.ok).toBe(true);
    const productBody = calls[0]?.value as Record<string, unknown>;
    expect(productBody).toMatchObject({ title: "Handwoven basket", description: "Woven in Kiambu", category: "Craft", priceKsh: 1500, priceNote: "", priceNegotiable: false, sku: "BK-01", stockQuantity: 4, inStock: true, unit: "piece", mediaAssetIds: ["m1"], altTexts: ["Front view"] });
    expect(productBody).not.toHaveProperty("images");
    expect(productBody).not.toHaveProperty("image");
    expect(productBody).not.toHaveProperty("mediaItems");
    for (const forbidden of ["leadTimeDays", "durationMinutes", "visitType", "serviceAreas", "availabilityStatus"]) expect(productBody).not.toHaveProperty(forbidden);
    expect(JSON.stringify(calls[0]?.value)).not.toMatch(DEVICE_URI_PATTERN);

    const service = await services.catalog.updateService("biz-1", "item-2", {
      name: "Tailoring", description: "Made to measure tailoring", category: "Services", priceLabel: "Hourly rate",
      priceKsh: null, priceNote: "Hourly rate", priceNegotiable: true, availability: "On request",
      availabilityStatus: "on_request", durationMinutes: 60, leadTimeDays: 2, visitType: "onsite",
      serviceAreas: ["Nairobi", " Kiambu ", ""], sku: "SHOULD-NOT-TRAVEL",
      images: ["file:///storage/emulated/0/tailoring.jpg"],
      gallery: [{ mediaAssetId: "m7", url: "asset://catalogue/m7", sortOrder: 0, altText: "Studio", contentType: "image/jpeg", sizeBytes: 10, provider: "local" }],
    });
    expect(service.ok).toBe(true);
    const serviceBody = calls[1]?.value as Record<string, unknown>;
    expect(serviceBody).toMatchObject({ title: "Tailoring", priceKsh: null, clearPrice: true, priceNote: "Hourly rate", priceNegotiable: true, availabilityStatus: "on_request", durationMinutes: 60, leadTimeDays: 2, visitType: "onsite", serviceAreas: ["Nairobi", "Kiambu"], mediaAssetIds: ["m7"], altTexts: ["Studio"] });
    for (const forbidden of ["sku", "stockQuantity", "inStock", "unit", "images", "image"]) expect(serviceBody).not.toHaveProperty(forbidden);
    expect(JSON.stringify(calls[1]?.value)).not.toMatch(DEVICE_URI_PATTERN);
  });

  it("keeps the stored price on create and clears it only when an update omits it", async () => {
    const calls: Call[] = [];
    const services = createApiServices({ config, client: clientWith({}, calls) });
    await services.catalog.createProduct("biz-1", { name: "Notebook", description: "Handbound notebook", category: "Stationery", price: 0, priceKsh: null, priceNote: "Free sample", availability: "Available", location: "" });
    await services.catalog.updateProduct("biz-1", "item-1", { name: "Notebook", priceKsh: 250 });
    expect(calls[0]?.value).toMatchObject({ priceKsh: null, priceNote: "Free sample" });
    expect(calls[0]?.value).not.toMatchObject({ clearPrice: expect.anything() });
    expect(calls[1]?.value).toMatchObject({ priceKsh: 250 });
  });

  it("uploads catalogue media as multipart form data on the business media route", async () => {
    const calls: Call[] = [];
    const services = createApiServices({ config, client: clientWith({ post: async () => success({ id: "m-77", businessId: "biz-1", provider: "local", contentType: "image/jpeg", sizeBytes: 4096, sha256: "abc", widthPx: null, heightPx: null, status: "ready", accessUrl: "/api/v1/media/m-77/content", createdAt: "2026-11-12T10:00:00Z" }) }, calls) });
    const result = await services.catalog.uploadCatalogMedia("biz-1", { uri: "file:///var/media/basket.jpg", fileName: "basket.jpg", contentType: "image/jpeg", sizeBytes: 4096 });
    expect(result.ok).toBe(true);
    expect(result.ok && result.data).toEqual({ mediaAssetId: "m-77", url: "https://api.example.test/api/v1/media/m-77/content", contentType: "image/jpeg", sizeBytes: 4096 });
    expect(calls[0]?.method).toBe("POST");
    expect(calls[0]?.path).toBe("/businesses/biz-1/media");
    const form = calls[0]?.value as FormData;
    expect(form).toBeInstanceOf(FormData);
    expect(form.has("file")).toBe(true);
  });

  it("refuses unsupported catalogue image types before any request is made", async () => {
    const calls: Call[] = [];
    const services = createApiServices({ config, client: clientWith({}, calls) });
    const result = await services.catalog.uploadCatalogMedia("biz-1", { uri: "file:///var/media/basket.tiff", fileName: "basket.tiff", contentType: "image/tiff" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("MEDIA_TYPE_NOT_SUPPORTED");
    expect(calls).toEqual([]);
  });

  it("passes API errors through unchanged instead of substituting local data", async () => {
    const failure: Result<never> = { ok: false, source: "api", requestId: "server-1", error: { code: "CATALOGUE_PUBLISH_DENIED", message: "Publishing requires an Owner, Admin or Editor role.", retryable: false, status: 403 } };
    const calls: Call[] = [];
    const services = createApiServices({ config, client: clientWith({
      get: async () => failure,
      post: async () => failure,
      put: async () => failure,
      patch: async () => failure,
      delete: async () => failure,
    }, calls) });

    const listed = await services.catalog.listProducts("biz-1", { limit: 20 });
    const detail = await services.catalog.getProduct("biz-1", "item-1");
    const published = await services.catalog.setProductStatus("biz-1", "item-1", "published");
    const gallery = await services.catalog.replaceProductGallery("biz-1", "item-1", [{ mediaAssetId: "m1" }]);
    const created = await services.catalog.createProduct("biz-1", { name: "Basket", description: "Woven basket", category: "Craft", price: 100, availability: "Available", location: "" });
    const discovery = await services.catalog.listPublicProducts({ limit: 20 });
    const publicDetail = await services.catalog.getPublicService("missing");

    for (const result of [listed, detail, published, gallery, created, discovery, publicDetail]) {
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.source).toBe("api");
        expect(result.error).toEqual(failure.error);
      }
    }
  });

  it("maps a 404 catalogue lookup to a not-found style error the detail screen can render", async () => {
    const missing: Result<never> = { ok: false, source: "api", requestId: "server-2", error: { code: "CATALOGUE_ITEM_NOT_FOUND", message: "The catalogue item was not found.", retryable: false, status: 404 } };
    const services = createApiServices({ config, client: clientWith({ get: async () => missing }) });
    const result = await services.catalog.getPublicProduct("draft-item");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatchObject({ code: "CATALOGUE_ITEM_NOT_FOUND", status: 404 });
  });

  it("offset-pages server catalogue lists into cursor results", async () => {
    const services = createApiServices({ config, client: clientWith({ get: async () => success({ items: [itemDto({})], total: 45, page: 2, pageSize: 20 }) }) });
    const result = await services.catalog.listProducts("biz-1", { limit: 20, cursor: "20" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.total).toBe(45);
      expect(result.data.nextCursor).toBe("40");
      expect(result.data.items[0]?.name).toBe("Handwoven basket");
    }
  });
});

describe("Stage 5 catalogue media helpers", () => {
  it("recognises device-only URIs and supported image types", () => {
    for (const uri of ["file:///var/x.jpg", "content://media/1", "blob:https://app.test/x", "asset://images/x", "/seed-images/x.jpg"]) expect(isDeviceFileUri(uri)).toBe(true);
    expect(isDeviceFileUri("https://cdn.test/x.jpg")).toBe(false);
    expect(isDeviceFileUri("")).toBe(false);
    for (const type of ["image/jpeg", "image/JPG", "image/png", "image/webp"]) expect(isSupportedCatalogueImage(type)).toBe(true);
    for (const type of ["image/tiff", "video/mp4", "", undefined]) expect(isSupportedCatalogueImage(type)).toBe(false);
  });

  it("mirrors the server intake rules with the server's own codes", () => {
    expect(catalogUploadIssue({ uri: "  ", fileName: "a.jpg", contentType: "image/jpeg" })).toMatchObject({ code: "MEDIA_EMPTY" });
    expect(catalogUploadIssue({ uri: "file:///a.tiff", fileName: "a.tiff", contentType: "image/tiff" })).toMatchObject({ code: "MEDIA_TYPE_NOT_SUPPORTED" });
    // Only the absolute ceiling is pre-checked; the configured server limit stays authoritative.
    expect(catalogUploadIssue({ uri: "file:///a.jpg", fileName: "a.jpg", contentType: "image/jpeg", sizeBytes: 13 * 1024 * 1024 })).toBeNull();
    expect(catalogUploadIssue({ uri: "file:///a.jpg", fileName: "a.jpg", contentType: "image/jpeg", sizeBytes: 65 * 1024 * 1024 })).toMatchObject({ code: "MEDIA_TOO_LARGE" });
    expect(catalogUploadIssue({ uri: "file:///a.jpg", fileName: "a.jpg", contentType: "image/jpeg", sizeBytes: 1024 })).toBeNull();
  });

  it("keeps the device URI in the native part and builds a web form from the fetched blob", async () => {
    const part = catalogNativeFilePart({ uri: "file:///var/x.png", fileName: "x.png", contentType: "image/png" });
    expect(part).toEqual({ uri: "file:///var/x.png", name: "x.png", type: "image/png" });
    expect(catalogNativeFilePart({ uri: "blob:https://app.test/y", fileName: "", contentType: "" })).toEqual({ uri: "blob:https://app.test/y", name: "catalogue-image.jpg", type: "image/jpeg" });

    const native = await buildCatalogMediaForm({ uri: "file:///var/x.jpg", fileName: "x.jpg", contentType: "image/jpeg" }, "native");
    expect(native).toBeInstanceOf(FormData);
    expect(native.has("file")).toBe(true);

    const blob = new Blob(["bytes"], { type: "image/jpeg" });
    const fetcher = vi.fn(async () => new Response(blob));
    const web = await buildCatalogMediaForm({ uri: "blob:https://app.test/x", fileName: "x.jpg", contentType: "image/jpeg" }, "web", fetcher as unknown as typeof fetch);
    expect(fetcher).toHaveBeenCalledWith("blob:https://app.test/x");
    const filed = web.get("file") as File;
    expect(filed.name).toBe("x.jpg");
    await expect(buildCatalogMediaForm({ uri: "blob:https://app.test/x", fileName: "x.jpg", contentType: "image/jpeg" }, "web", vi.fn(async () => new Response(null, { status: 404 })) as unknown as typeof fetch)).rejects.toThrow();
  });
});

describe("Stage 5 catalogue in local demo mode", () => {
  it("answers catalogue work locally and refuses to claim a media upload", async () => {
    const services = createMockServices();
    const listed = await services.catalog.listProducts("b-kivuli", { limit: 10 });
    expect(listed.ok).toBe(true);
    expect(listed.source).toBe("mock-local");

    const products = await services.catalog.listPublicProducts({ limit: 10, search: "a" });
    expect(products.ok).toBe(true);
    if (products.ok) {
      expect(products.source).toBe("mock-local");
      expect(products.data.items.every((item) => !item.archived)).toBe(true);
    }

    const upload = await services.catalog.uploadCatalogMedia("b-kivuli", { uri: "file:///demo.jpg", fileName: "demo.jpg", contentType: "image/jpeg" });
    expect(upload.ok).toBe(false);
    if (!upload.ok) {
      expect(upload.source).toBe("mock-local");
      expect(upload.error.code).toBe("LOCAL_ONLY");
    }
  });

  it("applies local lifecycle and gallery changes without touching any transport", async () => {
    const services = createMockServices();
    const products = await services.catalog.listProducts("b-kivuli", { limit: 10 });
    if (!products.ok) throw new Error("seed products expected");
    const first = products.data.items[0];
    if (!first) throw new Error("seed product expected");

    const published = await services.catalog.setProductStatus("b-kivuli", first.id, "published");
    expect(published.ok).toBe(true);
    if (published.ok) expect(published.data).toMatchObject({ status: "published", archived: false });

    const archived = await services.catalog.setProductStatus("b-kivuli", first.id, "archived");
    expect(archived.ok && archived.data.archived).toBe(true);

    const gallery = await services.catalog.replaceProductGallery("b-kivuli", first.id, [{ mediaAssetId: "local-1", altText: "Demo image" }]);
    expect(gallery.ok).toBe(true);
    if (gallery.ok) expect(gallery.data.gallery?.[0]).toMatchObject({ mediaAssetId: "local-1", sortOrder: 0, altText: "Demo image" });

    const detail = await services.catalog.getPublicProduct(first.id);
    expect(detail.ok).toBe(false);

    const restored = await services.catalog.setProductStatus("b-kivuli", first.id, "draft");
    expect(restored.ok && restored.data.status).toBe("draft");
  });
});
