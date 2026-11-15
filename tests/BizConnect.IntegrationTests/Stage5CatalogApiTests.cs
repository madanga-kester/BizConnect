using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

namespace BizConnect.IntegrationTests;

/// <summary>
/// Stage 5 coverage: catalogue CRUD and lifecycle, server-side role enforcement, ordered galleries,
/// real image uploads through the local provider, the access-controlled media proxy, the deletion guard
/// and public discovery. Every destructive action stays inside the bizconnect_test fixture database.
/// </summary>
[Collection(PostgresApiCollection.Name)]
public sealed class Stage5CatalogApiTests(PostgresApiFactory factory)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [Fact]
    public async Task CatalogueCrud_DraftPublishArchive_IsVisibleOnlyAfterPublish()
    {
        var (owner, _) = await NewUserAsync("catowner");
        using (owner)
        {
            var business = await CreateBusinessAsync(owner, "Highland Weaves", "public");
            var title = $"Kitenge Shirt {Guid.NewGuid():N}"[..24];

            var created = await owner.PostAsJsonAsync($"/api/v1/businesses/{business.Id}/products", new
            {
                title, description = "Hand-woven kitenge shirt", category = "Fashion", subcategory = "Clothing",
                priceKsh = 1200m, sku = $"KIT-{Guid.NewGuid():N}"[..12], stockQuantity = 12, inStock = true, unit = "each"
            });
            Assert.Equal(HttpStatusCode.Created, created.StatusCode);
            var draft = await created.Content.ReadFromJsonAsync<CatalogResult>(JsonOptions);
            Assert.NotNull(draft);
            Assert.Equal("draft", draft.Status);
            Assert.False(draft.IsPublished);
            Assert.Equal("Owner", draft.CurrentUserRole);
            Assert.Equal("product", draft.Kind);
            Assert.Equal("available", draft.AvailabilityStatus);

            // A draft is invisible to public discovery but readable by the business.
            var draftView = await owner.GetFromJsonAsync<CatalogPage>($"/api/v1/catalogue/products?search={Uri.EscapeDataString(title)}", JsonOptions);
            Assert.NotNull(draftView);
            Assert.Equal(0, draftView.Total);
            Assert.Equal(HttpStatusCode.OK, (await owner.GetAsync($"/api/v1/businesses/{business.Id}/products/{draft.Id}")).StatusCode);

            var published = await owner.PostAsJsonAsync($"/api/v1/businesses/{business.Id}/products/{draft.Id}/status", new { status = "published" });
            Assert.Equal(HttpStatusCode.OK, published.StatusCode);
            var publishedItem = await published.Content.ReadFromJsonAsync<CatalogResult>(JsonOptions);
            Assert.Equal("published", publishedItem!.Status);
            Assert.NotNull(publishedItem.PublishedAt);

            var discovered = await owner.GetFromJsonAsync<CatalogPage>($"/api/v1/catalogue/products?search={Uri.EscapeDataString(title)}", JsonOptions);
            Assert.Contains(discovered!.Items, x => x.Id == publishedItem.Id);
            var bySlug = await owner.GetFromJsonAsync<CatalogResult>($"/api/v1/catalogue/products/{publishedItem.Slug}", JsonOptions);
            Assert.Equal(publishedItem.Id, bySlug!.Id);

            var repriced = await owner.PatchAsJsonAsync($"/api/v1/businesses/{business.Id}/products/{draft.Id}", new { priceKsh = 990m });
            Assert.Equal(990m, (await repriced.Content.ReadFromJsonAsync<CatalogResult>(JsonOptions))!.PriceKsh);

            Assert.Equal(HttpStatusCode.NoContent, (await owner.DeleteAsync($"/api/v1/businesses/{business.Id}/products/{draft.Id}")).StatusCode);
            var afterArchive = await owner.GetFromJsonAsync<CatalogResult>($"/api/v1/businesses/{business.Id}/products/{draft.Id}", JsonOptions);
            Assert.Equal("archived", afterArchive!.Status);
            var archivedView = await owner.GetFromJsonAsync<CatalogPage>($"/api/v1/catalogue/products?search={Uri.EscapeDataString(title)}", JsonOptions);
            Assert.NotNull(archivedView);
            Assert.Equal(0, archivedView.Total);
            // Discovery detail no longer serves an archived item, by slug or by id.
            Assert.Equal(HttpStatusCode.NotFound, (await owner.GetAsync($"/api/v1/catalogue/products/{afterArchive.Slug}")).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await owner.GetAsync($"/api/v1/catalogue/products/{afterArchive.Id}")).StatusCode);
        }
    }

    [Fact]
    public async Task CatalogueRoles_ViewerIsReadOnly_EditorMayManage_NonMemberSeesNothing()
    {
        var (owner, _) = await NewUserAsync("catroleowner");
        var (viewer, viewerUser) = await NewUserAsync("catroleviewer");
        var (editor, editorUser) = await NewUserAsync("catroleeditor");
        var (outsider, _) = await NewUserAsync("catroleoutsider");
        using (owner) using (viewer) using (editor) using (outsider)
        {
            var business = await CreateBusinessAsync(owner, "Rift Valley Tools", "private");
            await AcceptInvitationAsync(owner, viewer, viewerUser, business.Id, "Viewer");
            await AcceptInvitationAsync(owner, editor, editorUser, business.Id, "Editor");
            var body = new { title = "Pipe Wrench", description = "Heavy duty wrench", category = "Hardware", priceKsh = 500m, sku = "WR-1" };

            // A Viewer can read the private catalogue but cannot write to it.
            var viewerList = await viewer.GetAsync($"/api/v1/businesses/{business.Id}/products");
            Assert.Equal(HttpStatusCode.OK, viewerList.StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await viewer.PostAsJsonAsync($"/api/v1/businesses/{business.Id}/products", body)).StatusCode);

            // An Editor may create and publish.
            var created = await editor.PostAsJsonAsync($"/api/v1/businesses/{business.Id}/products", body);
            Assert.Equal(HttpStatusCode.Created, created.StatusCode);
            var item = await created.Content.ReadFromJsonAsync<CatalogResult>(JsonOptions);
            Assert.Equal("Editor", item!.CurrentUserRole);
            Assert.Equal(HttpStatusCode.OK, (await editor.PostAsJsonAsync(
                $"/api/v1/businesses/{business.Id}/products/{item.Id}/status", new { status = "published" })).StatusCode);

            // A non-member cannot discover that the private business exists at all.
            Assert.Equal(HttpStatusCode.NotFound, (await outsider.PostAsJsonAsync($"/api/v1/businesses/{business.Id}/products", body)).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await outsider.GetAsync($"/api/v1/businesses/{business.Id}/products")).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await outsider.GetAsync($"/api/v1/businesses/{business.Id}/products/{item.Id}")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await editor.PatchAsJsonAsync(
                $"/api/v1/businesses/{business.Id}/members/{viewerUser.Id}/role", new { role = "Admin" })).StatusCode);
        }
    }

    [Fact]
    public async Task Catalogue_DuplicateSkuIsRejectedWithinBusiness()
    {
        var (owner, _) = await NewUserAsync("catsku");
        using (owner)
        {
            var business = await CreateBusinessAsync(owner, "Nairobi Print Shop");
            var sku = $"DUP-{Guid.NewGuid():N}"[..10];
            var first = await owner.PostAsJsonAsync($"/api/v1/businesses/{business.Id}/products", new
            {
                title = "A3 Poster", description = "Glossy poster", category = "Print", priceKsh = 300m, sku
            });
            Assert.Equal(HttpStatusCode.Created, first.StatusCode);
            var duplicate = await owner.PostAsJsonAsync($"/api/v1/businesses/{business.Id}/products", new
            {
                title = "A3 Poster Variant", description = "Another poster", category = "Print", priceKsh = 350m, sku
            });
            Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
            var problem = await duplicate.Content.ReadAsStringAsync();
            Assert.Contains("DUPLICATE_SKU", problem);
        }
    }

    [Fact]
    public async Task Catalogue_KindSpecificFieldsAndPricingAreEnforcedServerSide()
    {
        var (owner, _) = await NewUserAsync("catfields");
        using (owner)
        {
            var business = await CreateBusinessAsync(owner, "Fields Test Business");
            var productWithServiceFields = await owner.PostAsJsonAsync($"/api/v1/businesses/{business.Id}/products", new
            {
                title = "Bad Product", description = "Reject me", category = "Retail", priceKsh = 10m, durationMinutes = 60
            });
            Assert.Equal(HttpStatusCode.UnprocessableEntity, productWithServiceFields.StatusCode);

            var serviceWithSku = await owner.PostAsJsonAsync($"/api/v1/businesses/{business.Id}/services", new
            {
                title = "Bad Service", description = "Reject me", category = "Repair", priceKsh = 10m, sku = "SKU-1"
            });
            Assert.Equal(HttpStatusCode.UnprocessableEntity, serviceWithSku.StatusCode);

            var noPrice = await owner.PostAsJsonAsync($"/api/v1/businesses/{business.Id}/products", new
            {
                title = "Priceless", description = "No price information at all", category = "Retail"
            });
            Assert.Equal(HttpStatusCode.UnprocessableEntity, noPrice.StatusCode);

            var negotiableOnly = await owner.PostAsJsonAsync($"/api/v1/businesses/{business.Id}/products", new
            {
                title = "Call For Price", description = "Negotiable item", category = "Retail", priceNegotiable = true
            });
            Assert.Equal(HttpStatusCode.Created, negotiableOnly.StatusCode);

            var badAvailability = await owner.PostAsJsonAsync($"/api/v1/businesses/{business.Id}/services", new
            {
                title = "Tailoring", description = "Alterations", category = "Fashion", priceKsh = 500m, availabilityStatus = "whenever"
            });
            Assert.Equal(HttpStatusCode.BadRequest, badAvailability.StatusCode);
        }
    }

    [Fact]
    public async Task Catalogue_ServiceAvailabilityAndDiscoveryFilters_SortAndExcludePrivateBusinesses()
    {
        var (owner, _) = await NewUserAsync("catdisc");
        var (privateOwner, _) = await NewUserAsync("catdiscpriv");
        using (owner) using (privateOwner)
        {
            var business = await CreateBusinessAsync(owner, "Nyandi Farm Services");
            var marker = Guid.NewGuid().ToString("N")[..8];

            var tractor = await owner.PostAsJsonAsync($"/api/v1/businesses/{business.Id}/services", new
            {
                title = $"Tractor Hire {marker}", description = "Tractor for hire by the day", category = "Agriculture",
                priceKsh = 2000m, availabilityStatus = "available", serviceAreas = new[] { "Kakamega" }, visitType = "onsite"
            });
            Assert.Equal(HttpStatusCode.Created, tractor.StatusCode);
            var tractorItem = await tractor.Content.ReadFromJsonAsync<CatalogResult>(JsonOptions);
            Assert.Equal("service", tractorItem!.Kind);
            Assert.Equal("available", tractorItem.AvailabilityStatus);

            var soil = await owner.PostAsJsonAsync($"/api/v1/businesses/{business.Id}/services", new
            {
                title = $"Soil Testing {marker}", description = "Soil analysis with report", category = "Agriculture",
                priceKsh = 8000m, availabilityStatus = "on_request", durationMinutes = 90
            });
            Assert.Equal(HttpStatusCode.Created, soil.StatusCode);
            var soilItem = await soil.Content.ReadFromJsonAsync<CatalogResult>(JsonOptions);

            foreach (var id in new[] { tractorItem.Id, soilItem!.Id })
                Assert.Equal(HttpStatusCode.OK, (await owner.PostAsJsonAsync(
                    $"/api/v1/businesses/{business.Id}/services/{id}/status", new { status = "published" })).StatusCode);

            var priced = await owner.GetFromJsonAsync<CatalogPage>($"/api/v1/catalogue/services?search={marker}&minPrice=5000&sort=price_desc", JsonOptions);
            Assert.Single(priced!.Items);
            Assert.Equal(soilItem.Id, priced.Items[0].Id);

            var byAvailability = await owner.GetFromJsonAsync<CatalogPage>($"/api/v1/catalogue/services?search={marker}&availability=available", JsonOptions);
            Assert.Contains(byAvailability!.Items, x => x.Id == tractorItem.Id);
            Assert.DoesNotContain(byAvailability.Items, x => x.Id == soilItem.Id);

            Assert.Equal(HttpStatusCode.BadRequest, (await owner.GetAsync("/api/v1/catalogue/services?availability=nonsense")).StatusCode);

            // A published service of a private business never enters public discovery.
            var hiddenBusiness = await CreateBusinessAsync(privateOwner, "Hidden Salon", "private");
            var hidden = await privateOwner.PostAsJsonAsync($"/api/v1/businesses/{hiddenBusiness.Id}/services", new
            {
                title = $"Private Braiding {marker}", description = "Members only braiding", category = "Beauty", priceKsh = 1500m
            });
            Assert.Equal(HttpStatusCode.Created, hidden.StatusCode);
            var hiddenItem = await hidden.Content.ReadFromJsonAsync<CatalogResult>(JsonOptions);
            Assert.Equal(HttpStatusCode.OK, (await privateOwner.PostAsJsonAsync(
                $"/api/v1/businesses/{hiddenBusiness.Id}/services/{hiddenItem!.Id}/status", new { status = "published" })).StatusCode);

            var anonymous = factory.CreateClient();
            using (anonymous)
            {
                var publicView = await anonymous.GetFromJsonAsync<CatalogPage>($"/api/v1/catalogue/services?search={marker}", JsonOptions);
                Assert.Equal(2, publicView!.Total);
                Assert.DoesNotContain(publicView.Items, x => x.BusinessId == hiddenBusiness.Id);
                var countyView = await anonymous.GetFromJsonAsync<CatalogPage>($"/api/v1/catalogue/services?search={marker}&county=Mombasa", JsonOptions);
                Assert.NotNull(countyView);
                Assert.Equal(0, countyView.Total);
                Assert.Equal(HttpStatusCode.NotFound, (await anonymous.GetAsync($"/api/v1/catalogue/services/{hiddenItem.Slug}")).StatusCode);
            }
        }
    }

    [Fact]
    public async Task MediaUpload_AcceptsPngBySignature_RejectsNonImagesAndOversize()
    {
        var (owner, _) = await NewUserAsync("mediaowner");
        using (owner)
        {
            var business = await CreateBusinessAsync(owner, "Kilimani Gallery");

            var upload = await UploadPngAsync(owner, business.Id, 1);
            Assert.Equal("image/png", upload.ContentType);
            Assert.Equal(1, upload.WidthPx);
            Assert.Equal(1, upload.HeightPx);
            Assert.Equal("local", upload.Provider);
            Assert.StartsWith("/api/v1/media/", upload.AccessUrl);
            Assert.Equal(64, upload.Sha256.Length);

            // The storage key and the on-disk path must never reach the client.
            var body = await (await owner.GetAsync($"/api/v1/media/{upload.Id}")).Content.ReadAsStringAsync();
            Assert.DoesNotContain("storageKey", body, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("App_Data", body, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("http://", body, StringComparison.OrdinalIgnoreCase);

            var notAnImage = new MultipartFormDataContent();
            var text = new ByteArrayContent(Encoding.UTF8.GetBytes("this is definitely not a png"));
            text.Headers.ContentType = new MediaTypeHeaderValue("image/png");
            notAnImage.Add(text, "file", "evil.png");
            var rejected = await owner.PostAsync($"/api/v1/businesses/{business.Id}/media", notAnImage);
            Assert.Equal(HttpStatusCode.UnprocessableEntity, rejected.StatusCode);
            Assert.Contains("MEDIA_TYPE_NOT_SUPPORTED", await rejected.Content.ReadAsStringAsync());

            // Signature says PNG, declared size is fine, the real body is over the 1 MiB test cap.
            var oversize = new byte[1024 * 1024 + 64];
            Convert.FromBase64String(PngBase64).CopyTo(oversize, 0);
            var big = new ByteArrayContent(oversize);
            big.Headers.ContentType = new MediaTypeHeaderValue("image/png");
            using var bigForm = new MultipartFormDataContent { { big, "file", "big.png" } };
            var tooBig = await owner.PostAsync($"/api/v1/businesses/{business.Id}/media", bigForm);
            Assert.Equal(HttpStatusCode.BadRequest, tooBig.StatusCode);
            Assert.Contains("MEDIA_TOO_LARGE", await tooBig.Content.ReadAsStringAsync());
        }
    }

    [Fact]
    public async Task MediaProxy_BlocksDraftForAnonymous_ServesPublishedAndMemberPreviews()
    {
        var (owner, _) = await NewUserAsync("proxyowner");
        var anonymous = factory.CreateClient();
        using (owner) using (anonymous)
        {
            var business = await CreateBusinessAsync(owner, "Riverine Woodcraft");
            var image = await UploadPngAsync(owner, business.Id, 7);

            Assert.Equal(HttpStatusCode.NotFound, (await anonymous.GetAsync(image.AccessUrl)).StatusCode);
            var memberView = await owner.GetAsync(image.AccessUrl);
            Assert.Equal(HttpStatusCode.OK, memberView.StatusCode);
            Assert.Equal("image/png", memberView.Content.Headers.ContentType?.MediaType);

            var item = await CreatePublishedProductAsync(owner, business.Id, "Carved Stool", [image.Id]);
            var publicView = await anonymous.GetAsync(image.AccessUrl);
            Assert.Equal(HttpStatusCode.OK, publicView.StatusCode);
            Assert.Equal(image.Sha256, publicView.Headers.ETag?.Tag?.Trim('"'));

            // Unpublishing withdraws public access to the same asset id without deleting the bytes.
            await owner.PostAsJsonAsync($"/api/v1/businesses/{business.Id}/products/{item.Id}/status", new { status = "draft" });
            Assert.Equal(HttpStatusCode.NotFound, (await anonymous.GetAsync(image.AccessUrl)).StatusCode);
            Assert.Equal(HttpStatusCode.OK, (await owner.GetAsync(image.AccessUrl)).StatusCode);
        }
    }

    [Fact]
    public async Task MediaGallery_OrderingIsPreservedAndReorderable()
    {
        var (owner, _) = await NewUserAsync("galleryowner");
        using (owner)
        {
            var business = await CreateBusinessAsync(owner, "Sunset Textiles");
            var first = await UploadPngAsync(owner, business.Id, 11);
            var second = await UploadPngAsync(owner, business.Id, 22);
            var third = await UploadPngAsync(owner, business.Id, 33);

            var created = await CreateProductAsync(owner, business.Id, "Linen Throw",
                mediaAssetIds: [first.Id, second.Id, third.Id]);
            Assert.Equal(new[] { 0, 1, 2 }, created.Media.Select(x => x.SortOrder).ToArray());
            Assert.Equal(new[] { first.Id, second.Id, third.Id }, created.Media.Select(x => x.MediaAssetId).ToArray());

            var reordered = await owner.PutAsJsonAsync($"/api/v1/businesses/{business.Id}/products/{created.Id}/media", new
            {
                mediaAssetIds = new[] { third.Id, first.Id },
                altTexts = new[] { "Folded throw, front", "Close weave detail" }
            });
            Assert.Equal(HttpStatusCode.OK, reordered.StatusCode);
            var gallery = (await reordered.Content.ReadFromJsonAsync<CatalogResult>(JsonOptions))!.Media;
            Assert.Equal(new[] { third.Id, first.Id }, gallery.Select(x => x.MediaAssetId).ToArray());
            Assert.Equal("Folded throw, front", gallery[0].AltText);
            Assert.Equal("Close weave detail", gallery[1].AltText);
            Assert.DoesNotContain(gallery, x => x.MediaAssetId == second.Id);
            foreach (var entry in gallery)
                Assert.StartsWith("/api/v1/media/", entry.AccessUrl);
        }
    }

    [Fact]
    public async Task MediaDeletion_IsGuardedWhileAttached_ThenAllowed()
    {
        var (owner, _) = await NewUserAsync("delowner");
        using (owner)
        {
            var business = await CreateBusinessAsync(owner, "Thika Pottery");
            var image = await UploadPngAsync(owner, business.Id, 5);
            var item = await CreateProductAsync(owner, business.Id, "Clay Bowl", mediaAssetIds: new[] { image.Id });

            var blocked = await owner.DeleteAsync($"/api/v1/media/{image.Id}");
            Assert.Equal(HttpStatusCode.Conflict, blocked.StatusCode);
            Assert.Contains("MEDIA_IN_USE", await blocked.Content.ReadAsStringAsync());

            await owner.PutAsJsonAsync($"/api/v1/businesses/{business.Id}/products/{item.Id}/media", new { mediaAssetIds = Array.Empty<Guid>() });
            Assert.Equal(HttpStatusCode.NoContent, (await owner.DeleteAsync($"/api/v1/media/{image.Id}")).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await owner.GetAsync($"/api/v1/media/{image.Id}")).StatusCode);
        }
    }

    [Fact]
    public async Task MediaGallery_RejectsAnotherBusinessesAsset()
    {
        var (owner, _) = await NewUserAsync("stealowner");
        var (other, _) = await NewUserAsync("stealothers");
        using (owner) using (other)
        {
            var business = await CreateBusinessAsync(owner, "Kawangware Metals");
            var foreign = await CreateBusinessAsync(other, "Other Metals");
            var foreignImage = await UploadPngAsync(other, foreign.Id, 99);

            var attempt = await owner.PostAsJsonAsync($"/api/v1/businesses/{business.Id}/products", new
            {
                title = "Railing Section", description = "Steel railing", category = "Metalwork",
                priceKsh = 4500m, mediaAssetIds = new[] { foreignImage.Id }
            });
            Assert.Equal(HttpStatusCode.UnprocessableEntity, attempt.StatusCode);
            Assert.Contains("MEDIA_ASSET_NOT_USABLE", await attempt.Content.ReadAsStringAsync());
        }
    }

    [Fact]
    public async Task CatalogueRoutes_RequireAuthentication_AndDiscoveryAndHealthDoNot()
    {
        var anonymous = factory.CreateClient();
        using (anonymous)
        {
            var anyBusiness = Guid.NewGuid();
            Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync($"/api/v1/businesses/{anyBusiness}/products")).StatusCode);
            Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.PostAsJsonAsync($"/api/v1/businesses/{anyBusiness}/products",
                new { title = "Nope", description = "Nope", category = "Retail", priceKsh = 1m })).StatusCode);
            using var form = new MultipartFormDataContent { { new ByteArrayContent(Convert.FromBase64String(PngBase64)), "file", "x.png" } };
            Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.PostAsync($"/api/v1/businesses/{anyBusiness}/media", form)).StatusCode);
            Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.DeleteAsync($"/api/v1/media/{Guid.NewGuid()}")).StatusCode);

            Assert.Equal(HttpStatusCode.OK, (await anonymous.GetAsync("/api/v1/catalogue/products")).StatusCode);
            Assert.Equal(HttpStatusCode.OK, (await anonymous.GetAsync("/api/v1/catalogue/services")).StatusCode);
            Assert.Equal(HttpStatusCode.OK, (await anonymous.GetAsync("/health/live")).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await anonymous.GetAsync($"/api/v1/media/{Guid.NewGuid()}/content")).StatusCode);
        }
    }

    [Fact]
    public async Task OpenApi_DocumentsStage5CatalogueAndMediaRoutes()
    {
        var anonymous = factory.CreateClient();
        using (anonymous)
        {
            var document = await anonymous.GetStringAsync("/openapi/v1.json");
            foreach (var path in new[]
                     {
                         "/api/v1/businesses/{businessId}/products", "/api/v1/businesses/{businessId}/services/{serviceId}/status",
                         "/api/v1/businesses/{businessId}/products/{productId}/media", "/api/v1/businesses/{businessId}/media",
                         "/api/v1/catalogue/products", "/api/v1/catalogue/services/{slugOrId}", "/api/v1/media/{mediaId}/content"
                     })
                Assert.Contains(path, document);
        }
    }

    [Fact]
    public async Task Catalogue_ArchivedItemCannotBeEdited_ButCanBeRepublished()
    {
        var (owner, _) = await NewUserAsync("archowner");
        using (owner)
        {
            var business = await CreateBusinessAsync(owner, "Salte Farm Inputs");
            var item = await CreateProductAsync(owner, business.Id, "Dried Napier Grass");
            Assert.Equal(HttpStatusCode.NoContent, (await owner.DeleteAsync($"/api/v1/businesses/{business.Id}/products/{item.Id}")).StatusCode);
            Assert.Equal(HttpStatusCode.UnprocessableEntity,
                (await owner.PatchAsJsonAsync($"/api/v1/businesses/{business.Id}/products/{item.Id}", new { priceKsh = 250m })).StatusCode);

            var republished = await owner.PostAsJsonAsync($"/api/v1/businesses/{business.Id}/products/{item.Id}/status", new { status = "published" });
            Assert.Equal(HttpStatusCode.OK, republished.StatusCode);
            var result = await republished.Content.ReadFromJsonAsync<CatalogResult>(JsonOptions);
            Assert.Equal("published", result!.Status);
            Assert.Null(result.ArchivedAt);
            Assert.NotNull(result.PublishedAt);
        }
    }

    [Fact]
    public async Task Catalogue_ManagementList_FiltersByKindStatusAndSearch()
    {
        var (owner, _) = await NewUserAsync("listowner");
        using (owner)
        {
            var business = await CreateBusinessAsync(owner, "Mavoko Hardware Hub");
            var token = Guid.NewGuid().ToString("N")[..8];
            await CreateProductAsync(owner, business.Id, $"Hammer {token}");
            await CreatePublishedProductAsync(owner, business.Id, $"Chisel {token}");
            var service = await owner.PostAsJsonAsync($"/api/v1/businesses/{business.Id}/services", new
            {
                title = $"Drilling {token}", description = "Concrete drilling", category = "Repair", priceKsh = 3000m
            });
            Assert.Equal(HttpStatusCode.Created, service.StatusCode);

            var all = await owner.GetFromJsonAsync<CatalogPage>($"/api/v1/businesses/{business.Id}/products?search={token}", JsonOptions);
            Assert.Equal(2, all!.Total);
            Assert.All(all.Items, x => Assert.Equal("product", x.Kind));

            var services = await owner.GetFromJsonAsync<CatalogPage>($"/api/v1/businesses/{business.Id}/services?search={token}", JsonOptions);
            Assert.Equal(1, services!.Total);

            var publishedOnly = await owner.GetFromJsonAsync<CatalogPage>($"/api/v1/businesses/{business.Id}/products?search={token}&status=published", JsonOptions);
            Assert.Single(publishedOnly!.Items);
            Assert.Contains(publishedOnly.Items, x => x.Title.Contains("Chisel"));
        }
    }

    // ---- helpers ----

    private const string PngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==";

    /// <summary>Minimal valid 1x1 PNG. The seed byte suffix changes the hash so one test can attach several images.</summary>
    private static byte[] PngBytes(int seed) => [.. Convert.FromBase64String(PngBase64), .. Encoding.ASCII.GetBytes($"#{seed}")];

    private static async Task<MediaResult> UploadPngAsync(HttpClient client, string businessId, int seed)
    {
        // application/octet-stream is declared on purpose: the server must decide the type from the bytes.
        var content = new ByteArrayContent(PngBytes(seed));
        content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
        using var form = new MultipartFormDataContent { { content, "file", $"sample-{seed}.png" } };
        var response = await client.PostAsync($"/api/v1/businesses/{businessId}/media", form);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<MediaResult>(JsonOptions))!;
    }

    private static async Task<CatalogResult> CreateProductAsync(HttpClient client, string businessId, string title, IReadOnlyList<string>? mediaAssetIds = null)
    {
        var response = await client.PostAsJsonAsync($"/api/v1/businesses/{businessId}/products", new
        {
            title, description = $"{title} description", category = "Retail", subcategory = "General",
            priceKsh = 750m, sku = $"SKU-{Guid.NewGuid():N}"[..12], stockQuantity = 5, inStock = true,
            mediaAssetIds = mediaAssetIds ?? Array.Empty<string>()
        });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<CatalogResult>(JsonOptions))!;
    }

    private static async Task<CatalogResult> CreatePublishedProductAsync(HttpClient client, string businessId, string title, IReadOnlyList<string>? mediaAssetIds = null)
    {
        var created = await CreateProductAsync(client, businessId, title, mediaAssetIds);
        var published = await client.PostAsJsonAsync($"/api/v1/businesses/{businessId}/products/{created.Id}/status", new { status = "published" });
        Assert.Equal(HttpStatusCode.OK, published.StatusCode);
        return (await published.Content.ReadFromJsonAsync<CatalogResult>(JsonOptions))!;
    }

    private async Task<(HttpClient Client, TestUser User)> NewUserAsync(string prefix)
    {
        var username = $"{prefix}{Guid.NewGuid():N}"[..Math.Min(prefix.Length + 10, 28)];
        var client = factory.CreateClient();
        var registration = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            name = username, username, email = $"{username}@example.test", phone = (string?)null,
            password = "P@ssword12345", county = "Nairobi", town = "Nairobi", interests = new[] { "Retail" }, avatar = (string?)null
        });
        Assert.Equal(HttpStatusCode.Created, registration.StatusCode);
        var registered = (await registration.Content.ReadFromJsonAsync<UserResult>(JsonOptions))!;
        var login = await client.PostAsJsonAsync("/api/v1/auth/login", new { identifier = registered.Email, password = "P@ssword12345" });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var session = (await login.Content.ReadFromJsonAsync<AuthResult>(JsonOptions))!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", session.AccessToken);
        return (client, new TestUser(registered.Id, registered.Email!, username));
    }

    private static async Task<BusinessResult> CreateBusinessAsync(HttpClient client, string name, string visibility = "public")
    {
        var response = await client.PostAsJsonAsync("/api/v1/businesses", new
        {
            name, businessType = "hybrid", category = "Retail", subcategory = "General goods",
            description = "Products and services for the local market", about = "About this business", founder = "Founder",
            originStory = "Started locally", county = "Nairobi", town = "Nairobi", neighbourhood = "Westlands",
            serviceAreas = new[] { "Westlands", "Parklands" }, phone = "0712345678", whatsapp = "0712345678",
            email = (string?)null, website = (string?)null, priceRange = "KSh KSh", operatingHours = "Mon-Fri 9-5",
            logo = (string?)null, cover = (string?)null, visibility, socialLinks = new Dictionary<string, string>()
        });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<BusinessResult>(JsonOptions))!;
    }

    private static async Task AcceptInvitationAsync(HttpClient owner, HttpClient invitee, TestUser inviteeUser, string businessId, string role)
    {
        var invited = await owner.PostAsJsonAsync($"/api/v1/businesses/{businessId}/invitations", new { email = inviteeUser.Email, role });
        Assert.Equal(HttpStatusCode.Created, invited.StatusCode);
        var invitation = (await invited.Content.ReadFromJsonAsync<InvitationResult>(JsonOptions))!;
        var accepted = await invitee.PostAsync($"/api/v1/businesses/{businessId}/invitations/{invitation.Id}/accept", null);
        Assert.Equal(HttpStatusCode.OK, accepted.StatusCode);
    }

    private sealed record TestUser(string Id, string Email, string Username);
    private sealed record AuthResult(UserResult User, string AccessToken, string? RefreshToken, DateTimeOffset ExpiresAt);
    private sealed record UserResult(string Id, string Username, string Name, string? Email, string? Phone, string Bio, string County, string Town, bool PrivateProfile, bool EmailVerified);
    private sealed record BusinessResult(string Id, string OwnerId, string Slug, string Name, string Visibility, string Status);
    private sealed record InvitationResult(string Id, string BusinessId, string Role, string Status);
    private sealed record CatalogMediaResult(string MediaAssetId, int SortOrder, string AltText, string AccessUrl, string ContentType,
        long SizeBytes, int? WidthPx, int? HeightPx, string Provider);
    private sealed record CatalogResult(string Id, string BusinessId, string BusinessName, string Kind, string Title, string Slug,
        string Description, string Category, decimal? PriceKsh, string? Sku, int? StockQuantity, bool? InStock, string? Unit,
        string AvailabilityStatus, int? DurationMinutes, string? VisitType, string Status, bool IsPublished,
        List<CatalogMediaResult> Media, DateTimeOffset? PublishedAt, DateTimeOffset? ArchivedAt, string? CurrentUserRole);
    private sealed record CatalogPublicResult(string Id, string Kind, string Title, string Slug, string BusinessId, string BusinessName,
        decimal? PriceKsh, string AvailabilityStatus, List<CatalogMediaResult> Media);
    private sealed record CatalogPage(List<CatalogPublicResult> Items, int Total, int Page, int PageSize);
    private sealed record MediaResult(string Id, string BusinessId, string Provider, string ContentType, long SizeBytes, string Sha256,
        int? WidthPx, int? HeightPx, string Status, string AccessUrl, DateTimeOffset CreatedAt);
}
