import { expect, test, type Page } from "@playwright/test";

const DEMO_EMAIL = "amani.e2e.2026@example.ke";

async function openTab(page: Page, label: string) {
  const tab = page.getByRole("tab", { name: label });
  await expect(tab).toBeVisible();
  await tab.click();
}

async function goBack(page: Page) {
  const back = page.getByRole("button", { name: "Go back" }).last();
  await expect(back).toBeVisible();
  await back.click();
}

async function tabBackground(page: Page): Promise<string> {
  return page.getByRole("tablist").evaluate((element) => {
    let node: Element | null = element;
    while (node) {
      const value = getComputedStyle(node).backgroundColor;
      if (value !== "rgba(0, 0, 0, 0)" && value !== "transparent") return value;
      node = node.parentElement;
    }
    return "transparent";
  });
}

test("six core journeys: discover, onboard, publish, create a business, message, and switch theme", async ({ page }) => {
  test.setTimeout(240_000);
  const dialogMessages: string[] = [];
  page.on("dialog", (dialog) => { dialogMessages.push(dialog.message()); void dialog.accept(); });
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if ((url.protocol === "http:" || url.protocol === "https:") && !(url.port === "8081" && ["127.0.0.1", "localhost"].includes(url.hostname))) {
      await route.abort();
      return;
    }
    await route.continue();
  });

  await page.goto("/");

  await test.step("1. Guest searches for a Kenyan business and opens its profile", async () => {
    await expect(page.getByText("BizConnect", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Good morning,/)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Search" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open your profile" })).toBeVisible();
    await page.getByRole("button", { name: "More navigation options" }).click();
    await expect(page.getByRole("button", { name: "Business videos" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Notifications/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Messages" })).toBeVisible();
    await page.getByRole("button", { name: "Close quick navigation" }).click();
    await expect(page.getByRole("button", { name: "Business videos" })).toHaveCount(0);
    await openTab(page, "Discover");
    await page.getByLabel("Search businesses, products and people").fill("Kivuli Studio");
    await page.getByRole("button", { name: "Open Kivuli Studio business profile" }).click();
    await expect(page.getByText("Business profile", { exact: true })).toBeVisible();
    await expect(page.getByText("Kivuli Studio", { exact: true }).last()).toBeVisible();
    await expect(page.getByText(/Public business area/i)).toBeVisible();
    await goBack(page);
  });

  await test.step("2. Guest completes local registration, demo OTP and profile setup", async () => {
    await openTab(page, "Profile");
    await page.getByRole("button", { name: /Sign in or create account$/ }).click();
    await page.getByRole("button", { name: /Create an account$/ }).click();
    await page.getByLabel("Full name").fill("Amani E2E");
    await page.getByLabel("Username").fill("amani.e2e.2026");
    await page.getByLabel("Email").fill(DEMO_EMAIL);
    await page.getByLabel("Phone number").fill("+254 712 345 678");
    await page.getByRole("textbox", { name: "Password", exact: true }).fill("NairobiDemo2026!");
    await page.getByLabel("Confirm password").fill("NairobiDemo2026!");
    await page.getByRole("button", { name: "Continue to demo verification" }).click();
    const code = page.getByLabel("Six-digit demo code");
    await expect(code).toBeVisible();
    await code.fill("123456");
    await page.getByRole("button", { name: "Verify demo code" }).click();
    await expect(page.getByText("What would you like to discover?")).toBeVisible();
    await page.getByRole("button", { name: "Finish profile setup" }).click();
    await openTab(page, "Home");
    await expect(page.getByText("BizConnect", { exact: true }).last()).toBeVisible();
    await expect(page.getByText("Local demo session · no server account").last()).toBeVisible();
  });

  await test.step("3. User previews and publishes a post that stays on this device", async () => {
    await openTab(page, "Create");
    await expect(page.getByText("Make your next move.")).toBeVisible();
    await expect(page.getByText("Publish as")).toBeVisible();
    await expect(page.getByText("Choose a format")).toBeVisible();
    await expect(page.getByText("Business tools")).toBeVisible();
    await expect(page.getByRole("button", { name: "Manage products and services" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add business milestone" })).toBeVisible();
    const caption = "E2E local demo: a new Nairobi business idea #BizConnect";
    await page.getByLabel("What's the story?").fill(caption);
    await page.getByRole("button", { name: /Preview$/ }).click();
    await expect(page.getByText("Post preview")).toBeVisible();
    await expect(page.getByText(caption, { exact: true }).first()).toBeVisible();
    await page.getByRole("button", { name: /Publish locally$/ }).click();
    await page.getByRole("button", { name: "Save post locally", exact: true }).click();
    await expect(page.getByText(caption, { exact: true }).last()).toBeVisible();
    await expect(page.getByText("Published locally on this device; no server received the post", { exact: true }).last()).toBeVisible();
    await page.waitForTimeout(850);
  });

  await test.step("3a. User opens an existing post from My Content and removes it locally", async () => {
    await openTab(page, "Create");
    await page.getByRole("button", { name: "Manage my posts" }).last().click();
    await page.getByLabel("Search all content").last().fill("E2E local demo: a new Nairobi business idea");
    await expect(page.getByText(/Posts · .* · Published locally$/, { exact: true }).last()).toBeVisible();
    await expect(page.getByText(/Drafts · .* · Draft$/, { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: /Edit$/ }).click();
    await expect(page.getByLabel("What's the story?").last()).toHaveValue("E2E local demo: a new Nairobi business idea #BizConnect");
    await page.getByRole("button", { name: /Manage my posts$/ }).last().click();
    await page.getByLabel("Search all content").last().fill("E2E local demo: a new Nairobi business idea");
    await expect(page.getByText(/Posts · .* · Published locally$/, { exact: true }).last()).toBeVisible();
    await expect(page.getByText(/Drafts · .* · Draft$/, { exact: true }).last()).toHaveCount(0);
    await page.getByRole("button", { name: /Delete$/ }).last().click();
    await page.getByRole("button", { name: "Delete locally", exact: true }).click();
    await page.waitForTimeout(850);
    await expect(page.getByText("No content matches these filters", { exact: true }).last()).toBeVisible();
    await goBack(page);
  });

  await test.step("3b. User creates and votes in a local poll", async () => {
    await openTab(page, "Create");
    await page.getByRole("button", { name: "Poll", exact: true }).click();
    await page.getByLabel("What's the story?").last().fill("E2E local poll about business growth.");
    await page.getByLabel("Poll question").fill("Which would help most?");
    await page.getByLabel("Option 1").fill("More customers");
    await page.getByLabel("Option 2").fill("Better tools");
    await page.getByRole("button", { name: /Publish locally$/ }).click();
    await page.getByRole("button", { name: "Save post locally", exact: true }).click();
    await expect(page.getByText("Which would help most?", { exact: true }).last()).toBeVisible();
    const vote = page.getByRole("button", { name: /More customers, 0%/ });
    await expect(vote).toBeVisible();
    await vote.click();
    await expect(page.getByRole("button", { name: /More customers, 100%/ })).toBeVisible();
    await expect(page.getByText(/1 respondent/).last()).toBeVisible();
  });

  await test.step("3c. User edits and inserts a deterministic writing example", async () => {
    await openTab(page, "Create");
    await page.getByRole("button", { name: "Open writing assistant" }).click();
    await page.getByLabel("Your notes or rough idea").fill("A handmade accessories launch in Nairobi");
    await page.getByRole("button", { name: "Generate example" }).click();
    await expect(page.getByLabel("Edit generated example")).toBeVisible();
    await page.getByLabel("Edit generated example").fill("E2E edited deterministic local writing example.");
    await page.getByRole("button", { name: "Insert into composer" }).click();
    await expect(page.getByLabel("What's the story?").last()).toHaveValue("E2E edited deterministic local writing example.");
  });

  await test.step("3d. User publishes an ephemeral Social Story and preserves it in a Highlight", async () => {
    await openTab(page, "Stories");
    await page.getByRole("button", { name: "Create Story" }).first().click();
    await page.getByLabel("Caption").fill("E2E local Story for the highlight collection.");
    await page.getByRole("button", { name: "Preview Story" }).click();
    await expect(page.getByText(/^Story preview ·/)).toBeVisible();
    await page.getByRole("button", { name: /Publish Story locally$/ }).last().click();
    await page.getByRole("button", { name: /Save Story locally$/ }).last().click();
    await expect(page.getByText("Your Highlights", { exact: true }).last()).toBeVisible();
    await page.getByLabel("New Highlight title").last().fill("E2E moments");
    await page.getByRole("button", { name: /Create Highlight with 1 active Story$/ }).last().click();
    await page.getByRole("button", { name: "Manage", exact: true }).last().click();
    await expect(page.getByText("E2E moments", { exact: true }).last()).toBeVisible();
    await expect(page.getByText("Stories in this Highlight · 1", { exact: true })).toBeVisible();
    await expect(page.getByText("E2E local Story for the highlight collection.", { exact: true }).last()).toBeVisible();
    await page.getByRole("button", { name: /Remove from Highlight$/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Remove from Highlight", exact: true }).click();
    await expect(page.getByText("Stories in this Highlight · 0", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Add$/ })).toBeVisible();
    await page.getByRole("button", { name: /Add$/ }).click();
    await expect(page.getByText("Stories in this Highlight · 1", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /Remove$/ }).last().click();
    await page.getByRole("dialog").getByRole("button", { name: "Remove from Highlight", exact: true }).click();
    await expect(page.getByText("Stories in this Highlight · 0", { exact: true })).toBeVisible();
    await expect(page.getByText("E2E local Story for the highlight collection.", { exact: true }).last()).toBeVisible();
    await goBack(page);
  });

  await test.step("4. Owner completes the six-step local business profile flow", async () => {
    await openTab(page, "Create");
    await page.getByRole("button", { name: /Create business$/ }).click();
    await expect(page.getByText("Step 1 of 6")).toBeVisible();
    await page.getByLabel("Business name").fill("Pamoja Studio E2E");
    await page.getByLabel("Short description").fill("A local design studio created for the BizConnect journey audit.");
    await page.getByRole("button", { name: /Continue$/ }).click();
    await expect(page.getByText("Step 2 of 6")).toBeVisible();
    await page.getByLabel("How did the business start?").fill("A local founder saw a need for accessible design services.");
    await page.getByRole("button", { name: /Continue$/ }).click();
    await expect(page.getByText("Step 3 of 6")).toBeVisible();
    await page.getByLabel("Product name").fill("E2E sample tote");
    await page.getByLabel("Price in KSh").fill("1800");
    await page.getByRole("button", { name: /Continue$/ }).click();
    await expect(page.getByText("Step 4 of 6")).toBeVisible();
    await page.getByLabel("Neighbourhood").fill("Westlands");
    await page.getByRole("button", { name: /Continue$/ }).click();
    await expect(page.getByText("Step 5 of 6")).toBeVisible();
    await page.getByLabel("Business phone").fill("+254 712 345 678");
    await page.getByRole("button", { name: /Continue$/ }).click();
    await expect(page.getByText("Step 6 of 6")).toBeVisible();
    await expect(page.getByText("Preview your profile")).toBeVisible();
    await expect(page.getByText(/Not verified/)).toBeVisible();
    await page.getByRole("button", { name: /Save business profile$/ }).click();
    await expect(page.getByText("Pamoja Studio E2E", { exact: true }).last()).toBeVisible();
    await expect(page.getByText("Business profile", { exact: true })).toBeVisible();
    await expect.poll(() => dialogMessages.at(-1) ?? "").toContain("stored on this device only");
    await page.getByRole("button", { name: "View milestones" }).click();
    await page.getByRole("textbox", { name: "Title", exact: true }).fill("E2E first customer milestone");
    await page.getByRole("textbox", { name: "Description", exact: true }).fill("The local milestone should appear on this business profile timeline.");
    await page.getByRole("button", { name: "Review milestone" }).click();
    await page.getByRole("button", { name: "Save locally", exact: true }).click();
    await expect(page.getByText("E2E first customer milestone", { exact: true }).last()).toBeVisible();
    await goBack(page);
    await expect(page.getByText("E2E first customer milestone", { exact: true }).last()).toBeVisible();
    await page.getByRole("button", { name: "View milestones" }).click();
    await page.getByRole("button", { name: /Delete$/ }).last().click();
    await page.getByRole("button", { name: "Delete milestone", exact: true }).click();
    await expect(page.getByText("E2E first customer milestone", { exact: true })).toHaveCount(0);
    await goBack(page);
    await expect(page.getByText("E2E first customer milestone", { exact: true })).toHaveCount(0);
    await goBack(page);
  });

  await test.step("4a. Owner creates catalogue items, an offer, an event, and an opportunity", async () => {
    const start = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    const end = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 16);
    await openTab(page, "Create");

    await page.getByRole("button", { name: "Create product" }).click();
    await page.getByRole("button", { name: "Pamoja Studio E2E", exact: true }).click();
    await page.getByLabel("Product name").fill("E2E local product");
    await page.getByLabel("Category").fill("Accessories");
    await page.getByLabel("Description").last().fill("A product created from the dedicated Create flow.");
    await page.getByRole("textbox", { name: "Price · KSh", exact: true }).fill("1200");
    await page.getByRole("button", { name: /Preview$/ }).click();
    await expect(page.getByText("Preview · Pamoja Studio E2E")).toBeVisible();
    await page.getByRole("button", { name: "Review product details" }).click();
    await page.getByRole("button", { name: "Save locally", exact: true }).click();
    await expect(page.getByText("E2E local product", { exact: true }).last()).toBeVisible();
    await goBack(page);

    await page.getByRole("button", { name: "Create service" }).click();
    await page.getByRole("button", { name: "Pamoja Studio E2E", exact: true }).click();
    await page.getByLabel("Service name").fill("E2E local service");
    await page.getByLabel("Category").fill("Design");
    await page.getByLabel("Description").last().fill("A service created from the dedicated Create flow.");
    await page.getByLabel("Price or label").fill("KSh 900 per hour");
    await page.getByRole("button", { name: "Review service details" }).click();
    await page.getByRole("button", { name: "Save locally", exact: true }).click();
    await expect(page.getByText("E2E local service", { exact: true }).last()).toBeVisible();
    await goBack(page);

    await page.getByRole("button", { name: "Create offer" }).click();
    await page.getByRole("button", { name: "Pamoja Studio E2E", exact: true }).click();
    await page.getByRole("textbox", { name: "Title", exact: true }).fill("E2E local weekend offer");
    await page.getByLabel("Description").last().fill("A local offer for the automated creation journey.");
    await page.getByLabel(/Starts at/).fill(start);
    await page.getByLabel(/Expires at/).fill(end);
    await page.getByRole("button", { name: "Review and save locally" }).click();
    await page.getByRole("button", { name: "Save locally", exact: true }).click();
    await expect(page.getByText("E2E local weekend offer", { exact: true }).last()).toBeVisible();
    await goBack(page);

    await page.getByRole("button", { name: "Create event" }).click();
    await page.getByRole("textbox", { name: "Title", exact: true }).fill("E2E local founder workshop");
    await page.getByLabel("Description").last().fill("A local business workshop created during automated verification.");
    await page.getByLabel(/Date and time/).fill(start);
    await page.getByLabel("Physical venue").fill("Westlands, Nairobi");
    await page.getByLabel("Contact information").fill("+254 712 345 678");
    await page.getByRole("button", { name: "Review and save locally" }).click();
    await page.getByRole("button", { name: "Save locally", exact: true }).click();
    await expect(page.getByText("E2E local founder workshop", { exact: true })).toBeVisible();
    await goBack(page);

    await page.getByRole("button", { name: "Publish opportunity" }).click();
    await page.getByRole("textbox", { name: "Title", exact: true }).fill("E2E local supplier opportunity");
    await page.getByLabel("Description").last().fill("A local opportunity listing created from the Create hub.");
    await page.getByLabel("Location").fill("Nairobi County");
    await page.getByLabel("Requirements and terms").fill("Registered local suppliers with a product catalogue.");
    await page.getByRole("button", { name: "Review and save locally" }).click();
    await page.getByRole("button", { name: "Save locally", exact: true }).click();
    await expect(page.getByText("E2E local supplier opportunity", { exact: true })).toBeVisible();
    await goBack(page);
  });

  await test.step("5. User follows a business and sends a local enquiry message", async () => {
    await openTab(page, "Discover");
    await expect(page.getByRole("button", { name: "Open Kivuli Studio business profile" }).last()).toBeVisible();
    await page.getByRole("button", { name: "Open Kivuli Studio business profile" }).click();
    const following = page.getByRole("button", { name: /Following$/ });
    if (await following.isVisible()) await following.click();
    const follow = page.getByRole("button", { name: /Follow$/ });
    if (await follow.isVisible()) await follow.click();
    await expect(page.getByRole("button", { name: /Following$/ })).toBeVisible();
    await page.getByRole("button", { name: /Message$/ }).click();
    await expect(page.getByText(/Local chat demo · nothing is delivered/i)).toBeVisible();
    await page.getByPlaceholder("Write a message…").fill("Hello from the BizConnect E2E audit.");
    await page.getByRole("button", { name: "Send local demo message" }).click();
    await expect(page.getByText("Hello from the BizConnect E2E audit.", { exact: true })).toBeVisible();
    await expect(page.getByText("Sent locally", { exact: true })).toBeVisible();
    await goBack(page);
    await goBack(page);
  });

  await test.step("6. Dark appearance is saved locally and themes the bottom navigation black", async () => {
    await openTab(page, "Profile");
    await page.getByRole("button", { name: "Settings" }).click();
    await page.getByRole("button", { name: /^Dark$/i }).click();
    await goBack(page);
    await expect(page.getByRole("tablist")).toBeVisible();
    await expect.poll(() => tabBackground(page)).toBe("rgb(0, 0, 0)");
    await expect.poll(() => page.evaluate(() => {
      const stored = window.localStorage.getItem("bizconnect-demo-state-v1");
      return stored ? JSON.parse(stored).settings?.appearance : undefined;
    })).toBe("dark");
    await openTab(page, "Home");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});
