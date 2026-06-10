const state = {
  config: null,
  store: null,
  demo: null,
  frontier: null,
  currentSession: null,
  judgeMode: null,
  moonpayCapabilities: null,
  moonpayWorkbench: null,
  placesService: null,
  googleReady: false,
  x402Info: null,
  x402Registry: null,
  x402Session: null,
  x402Agents: null,
  aiProviders: null,
};

init().catch((error) => {
  console.error(error);
  document.getElementById("places-results").textContent = "Storefront failed to initialize.";
});

async function init() {
  const [configRes, storeRes, demoRes] = await Promise.all([
    fetch("/api/config"),
    fetch("/api/store"),
    fetch("/api/demo"),
  ]);

  state.config = await configRes.json();
  state.store = await storeRes.json();
  state.demo = await demoRes.json();
  const frontierRes = await fetch("/api/frontier");
  state.frontier = await frontierRes.json();
  const judgeModeRes = await fetch("/api/judge-mode");
  state.judgeMode = await judgeModeRes.json();

  const [capabilitiesRes, workbenchRes] = await Promise.all([
    fetch("/api/moonpay/capabilities"),
    fetch("/api/moonpay/workbench"),
  ]);
  state.moonpayCapabilities = await capabilitiesRes.json();
  state.moonpayWorkbench = await workbenchRes.json();
  const aiProvidersRes = await fetch("/api/ai/providers");
  state.aiProviders = await aiProvidersRes.json();

  renderMetrics();
  renderHero();
  renderSecurity();
  renderLaunchChecklist();
  renderOffers();
  renderCategories();
  renderProducts();
  renderProtocolMatrix();
  renderRoadmap();
  renderMoonPay();
  renderMoonPayAgentOps();
  renderFleet();
  renderDifferentiators();
  renderFrontier();
  renderCheckoutLab();
  renderJudgeMode();
  renderLiveAgentState();
  renderAiProviders();
  bindPlaces();
  bindMoonPay();
  bindCheckoutLab();
  bindJudgeMode();
  bindLiveAgents();
  bindX402();

  if (state.config.public.googleApiKey) {
    await loadGooglePlaces(state.config.public.googleApiKey);
  }

  await loadX402();
}

function renderHero() {
  const { headline, summary } = state.demo;
  document.getElementById("hero-title").textContent = headline.title;
  document.getElementById("hero-subtitle").textContent = headline.subtitle;
  document.getElementById("judge-angle").textContent = headline.judgeAngle;
  document.getElementById("hero-badges").innerHTML = [
    `${summary.productCount} products`,
    `${summary.protocolCount} payment rails`,
    `${summary.agentCount} specialist agents`,
    `${summary.revenueRunrateHint} starter GMV`,
  ]
    .map((value) => `<span class="chip chip-strong">${escapeHtml(value)}</span>`)
    .join("");

  document.getElementById("demo-flow").innerHTML = state.demo.demoFlow
    .map(
      (item) => `
        <article class="flow-card">
          <span class="flow-step">${escapeHtml(item.step)}</span>
          <div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.detail)}</p>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderMetrics() {
  const { manifest } = state.store;
  const summary = state.demo.summary;
  const metrics = [
    ["Fleet Agents", String(summary.agentCount)],
    ["Protocols", manifest.commerce.protocols.join(" · ")],
    ["Settlement", manifest.commerce.settlementAsset],
    ["Workflows", String(summary.workflowCount)],
  ];

  document.getElementById("metrics").innerHTML = metrics
    .map(([label, value]) => `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`)
    .join("");
}

function renderSecurity() {
  const { manifest } = state.store;
  const items = [
    "Apigee private ingress with Private Service Connect.",
    "VPC Service Controls perimeter for production isolation.",
    "Trace/debug masking with private.* flow variables.",
    `Admitted agents only: ${manifest.policy.allowAgents.join(", ")}.`,
    `Denied by policy: ${manifest.policy.denyAgents.join(", ")}.`,
  ];
  document.getElementById("security-list").innerHTML = items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
}

function renderLaunchChecklist() {
  document.getElementById("launch-checklist").innerHTML = state.demo.launchChecklist
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
}

function renderOffers() {
  const offers = state.store.catalog.featuredOffers || [];
  document.getElementById("offers").innerHTML = offers
    .map(
      (offer) => `
        <article class="offer">
          <h3>${escapeHtml(offer.label)}</h3>
          <p>${escapeHtml(humanize(offer.category))}</p>
          <div class="meta-line">
            <span class="chip">${escapeHtml(offer.price)}</span>
            <span class="chip">${escapeHtml(offer.protocol)}</span>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderCategories() {
  const categories = state.demo.categorySummaries || [];
  document.getElementById("categories").innerHTML = categories
    .map(
      (category) => `
        <article class="category-card">
          <div class="frontier-head">
            <h3>${escapeHtml(category.label)}</h3>
            <span class="chip">${escapeHtml(String(category.productCount))} products</span>
          </div>
          <p>${escapeHtml(category.description)}</p>
          <div class="meta-line">
            <span class="chip">From ${escapeHtml(category.cheapest)}</span>
            ${category.protocols.map((protocol) => `<span class="chip">${escapeHtml(protocol)}</span>`).join("")}
          </div>
        </article>
      `,
    )
    .join("");
}

function renderProducts() {
  const products = state.store.catalog.products || [];
  document.getElementById("products").innerHTML = products
    .map(
      (product) => `
        <article class="product">
          <h3>${escapeHtml(product.title)}</h3>
          <p>${escapeHtml(product.description)}</p>
          <div class="meta-line">
            <span class="chip">${escapeHtml(product.price.amount)} ${escapeHtml(product.price.asset)}</span>
            ${product.clawdPrice ? `<span class="chip chip-strong">${escapeHtml(product.clawdPrice.amount)} ${escapeHtml(product.clawdPrice.asset)}</span>` : ""}
            <span class="chip">${escapeHtml(humanize(product.category))}</span>
            ${product.inference ? `<span class="chip">${escapeHtml(product.inference.provider)} · ${escapeHtml(product.inference.model)}</span>` : ""}
            ${product.protocols.map((protocol) => `<span class="chip">${escapeHtml(protocol)}</span>`).join("")}
          </div>
          <div class="meta-line">
            <a class="button button-secondary button-small" href="#checkout-lab" data-buy-product="${escapeHtml(product.id)}">Buy In Demo</a>
          </div>
        </article>
      `,
    )
    .join("");

  document.querySelectorAll("[data-buy-product]").forEach((node) => {
    node.addEventListener("click", () => {
      const productId = node.getAttribute("data-buy-product");
      const select = document.getElementById("checkout-product");
      select.value = productId;
      updateCheckoutProtocols();
    });
  });
}

function renderProtocolMatrix() {
  const protocols = state.demo.protocolMatrix || [];
  document.getElementById("protocol-matrix").innerHTML = protocols
    .map(
      (protocol) => `
        <article class="rail-card">
          <h3>${escapeHtml(protocol.title)}</h3>
          <p>${escapeHtml(protocol.useCase)}</p>
          <div class="meta-line">
            <span class="chip">${escapeHtml(String(protocol.coverage))} products wired</span>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderRoadmap() {
  const items = state.demo.roadmap || [];
  document.getElementById("roadmap").innerHTML = items
    .map(
      (item) => `
        <article class="journey-card">
          <span class="journey-stage">${escapeHtml(item.stage)}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.proof)}</p>
        </article>
      `,
    )
    .join("");
}

function renderMoonPay() {
  const { public: publicConfig, guards } = state.config;
  const link = document.getElementById("moonpay-link");
  const summary = document.getElementById("moonpay-summary");
  const configBox = document.getElementById("merchant-config");

  link.href = "#";
  summary.textContent = publicConfig.moonPayConfigured
    ? "MoonPay onramp links are generated server-side; browser config only shows masked status values."
    : "MoonPay config is not loaded yet. Add it to .env.local before demo time.";

  const rows = [
    ["Merchant ID", publicConfig.moonPayMerchantIdDisplay || "missing"],
    ["Wallet", publicConfig.moonPayWalletDisplay || "missing"],
    ["API Key", publicConfig.moonPayApiKeyDisplay || "missing"],
    ["Bucket", publicConfig.merchantBucketDisplay || "missing"],
    ["SFTP Host", publicConfig.merchantServer || "missing"],
    ["Secrets Protected", guards.secretsProtected ? "yes" : "no"],
    ["Browser Keys Exposed", guards.browserPublicKeysExposed ? "yes" : "no"],
  ];

  configBox.innerHTML = rows
    .map(([label, value]) => `<div class="terminal-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`)
    .join("");

  refreshMoonPayLink().catch(() => {
    link.href = "#";
  });
}

function renderMoonPayAgentOps() {
  const capabilityBox = document.getElementById("moonpay-capabilities");
  const workbenchBox = document.getElementById("moonpay-workbench");
  const caps = state.moonpayCapabilities;
  const workbench = state.moonpayWorkbench;

  capabilityBox.innerHTML = [
    ["CLI Installed", caps.installed ? "yes" : "no"],
    ["Version", caps.version || "not installed"],
    ["Surfaces", caps.surfaces.join(" · ")],
    ["Safety", caps.safety[0]],
  ]
    .map(([label, value]) => `<div class="terminal-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`)
    .join("");

  workbenchBox.innerHTML = [
    ...workbench.lanes.map(
      (lane) =>
        `<div class="terminal-row"><span>${escapeHtml(lane.title)}</span><strong>${escapeHtml(lane.actions[0])}</strong></div>`,
    ),
    `<div class="terminal-row"><span>MCP</span><strong>${escapeHtml(workbench.mcp.command)}</strong></div>`,
  ].join("");
}

function renderFleet() {
  const fleet = state.store.manifest.agents || [];
  document.getElementById("fleet").innerHTML = fleet
    .map(
      (agent) => `
        <article class="fleet-card">
          <h3>${escapeHtml(agent.name)}</h3>
          <p>${escapeHtml(agent.prompt || agent.role)}</p>
          <div class="lane-meta">
            <span class="chip">${escapeHtml(agent.runtime.lane)}</span>
            <span class="chip">${escapeHtml(agent.runtime.sandbox)}</span>
            <span class="chip">${escapeHtml(agent.runtime.cadence)}</span>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderDifferentiators() {
  document.getElementById("differentiators").innerHTML = state.demo.differentiators
    .map(
      (item, index) => `
        <article class="differentiator-card">
          <span class="flow-step">${escapeHtml(String(index + 1))}</span>
          <p>${escapeHtml(item)}</p>
        </article>
      `,
    )
    .join("");
}

function renderCheckoutLab() {
  const productSelect = document.getElementById("checkout-product");
  productSelect.innerHTML = state.store.catalog.products
    .map((product) => `<option value="${escapeHtml(product.id)}">${escapeHtml(product.title)}</option>`)
    .join("");
  updateCheckoutProtocols();
}

function renderJudgeMode() {
  document.getElementById("judge-mode").innerHTML = state.judgeMode.beats
    .map(
      (beat) => `
        <article class="journey-card">
          <span class="journey-stage">${escapeHtml(beat.label)}</span>
          <p>${escapeHtml(beat.script)}</p>
        </article>
      `,
    )
    .join("");
}

function renderLiveAgentState() {
  const guards = state.config?.guards || {};
  document.getElementById("gemini-output").textContent = guards.geminiServerSideEnabled
    ? "Gemini server-side route is ready."
    : "GOOGLE_API_KEY is missing or invalid for server-side Gemini requests.";
  document.getElementById("wallet-brief-output").textContent = guards.heliusServerSideEnabled
    ? "Helius server-side route is ready."
    : "HELIUS_RPC_URL is missing for wallet intelligence.";
}

function renderAiProviders() {
  const box = document.getElementById("ai-provider-output");
  if (!box) return;
  const providers = state.aiProviders?.providers || {};
  const rows = [
    ["Active", `${state.aiProviders?.active?.provider || "none"} / ${state.aiProviders?.active?.model || "none"}`],
    ["OpenRouter", providers.openrouter?.configured ? `ready (${providers.openrouter.model})` : `key missing (${providers.openrouter?.model || "not configured"})`],
    ["OpenRouter Free Models", String(providers.openrouter?.freeModels?.length || 0)],
    ["xAI Grok", providers.xai?.configured ? `ready (${providers.xai.textModel})` : `key missing (${providers.xai?.textModel || "not configured"})`],
    ["Grok Imagine", providers.xai?.imageModel || "not configured"],
    ["OpenAI", providers.openai?.configured ? `ready (${providers.openai.model})` : "key missing"],
  ];
  box.textContent = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
}

function renderFrontier() {
  const metricsBox = document.getElementById("frontier-metrics");
  const groupsBox = document.getElementById("frontier-groups");
  const signalsBox = document.getElementById("frontier-signals");
  const frontier = state.frontier;

  metricsBox.innerHTML = [
    ["Companies", String(frontier.totalCompanies)],
    ["Themes", String(frontier.themes.length)],
    ["Core Thesis", frontier.thesis[0]],
  ]
    .map(([label, value]) => `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`)
    .join("");

  signalsBox.innerHTML = state.demo.frontierSignals
    .map(
      (signal) => `
        <article class="signal-card">
          <h3>${escapeHtml(signal.label)}</h3>
          <p>${escapeHtml(signal.borrowedForOpenClawd)}</p>
          <div class="meta-line">
            ${signal.examples.map((company) => `<span class="chip">${escapeHtml(company.name)}</span>`).join("")}
          </div>
        </article>
      `,
    )
    .join("");

  groupsBox.innerHTML = frontier.groups
    .map((group) => {
      const featured = group.companies.slice(0, 4);
      const tail = Math.max(group.count - featured.length, 0);
      return `
        <article class="frontier-card">
          <div class="frontier-head">
            <h3>${escapeHtml(humanize(group.theme))}</h3>
            <span class="chip">${escapeHtml(String(group.count))} signals</span>
          </div>
          <p>${escapeHtml(featured[0]?.adaptation || "")}</p>
          <div class="meta-line">
            ${featured.map((company) => `<span class="chip">${escapeHtml(company.name)}</span>`).join("")}
            ${tail ? `<span class="chip">+${escapeHtml(String(tail))} more</span>` : ""}
          </div>
        </article>
      `;
    })
    .join("");
}

function bindPlaces() {
  const button = document.getElementById("places-search");
  button.addEventListener("click", searchPlaces);
}

function bindMoonPay() {
  document.getElementById("moonpay-refresh").addEventListener("click", refreshMoonPayLink);
}

function bindCheckoutLab() {
  document.getElementById("checkout-product").addEventListener("change", updateCheckoutProtocols);
  document.getElementById("checkout-product").addEventListener("change", updateCheckoutAssets);
  document.getElementById("checkout-create").addEventListener("click", createCheckoutSession);
  document.getElementById("checkout-fund").addEventListener("click", fundCheckoutSession);
}

function bindJudgeMode() {
  document.getElementById("judge-mode-play").addEventListener("click", () => {
    const firstProduct = state.store.catalog.products[0];
    document.getElementById("checkout-product").value = firstProduct.id;
    updateCheckoutProtocols();
    updateCheckoutAssets();
    document.getElementById("checkout-buyer-name").value = "Hackathon Judge";
    document.getElementById("checkout-buyer-email").value = "judge@openclawd.demo";
    document.getElementById("checkout-session").innerHTML =
      `<div class="terminal-row"><span>Judge Mode</span><strong>${escapeHtml(state.judgeMode.duration)}</strong></div>`;
    document.getElementById("checkout-fulfillment").textContent =
      "1. Create session\n2. Open MoonPay if needed\n3. Mark funded\n4. Read the artifact out loud";
    document.getElementById("checkout-lab").scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function bindLiveAgents() {
  document.getElementById("gemini-run").addEventListener("click", runGeminiAgent);
  document.getElementById("wallet-brief-run").addEventListener("click", runWalletBrief);
}

async function loadGooglePlaces(apiKey) {
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&v=weekly`;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  state.googleReady = true;
  const container = document.createElement("div");
  state.placesService = new google.maps.places.PlacesService(container);
  document.getElementById("places-results").textContent = "Google Places ready.";
}

function searchPlaces() {
  const results = document.getElementById("places-results");
  if (!state.googleReady || !state.placesService) {
    results.textContent = "Google Places is unavailable. Add a browser-restricted GOOGLE_API_KEY.";
    return;
  }

  const query = document.getElementById("places-query").value.trim();
  results.textContent = "Searching...";
  state.placesService.textSearch({ query }, (places, status) => {
    if (status !== google.maps.places.PlacesServiceStatus.OK || !places?.length) {
      results.textContent = `No Google Places results. Status: ${status}`;
      return;
    }
    results.innerHTML = places
      .slice(0, 4)
      .map((place) => {
        const address = place.formatted_address || "Address unavailable";
        return `<div class="place-row"><span>${escapeHtml(place.name)}</span><strong>${escapeHtml(address)}</strong></div>`;
      })
      .join("");
  });
}

function buildMoonPayUrl(config) {
  if (!config.moonPayApiKey || !config.moonPayWallet) return "#";
  const params = new URLSearchParams({
    apiKey: config.moonPayApiKey,
    walletAddress: config.moonPayWallet,
    currencyCode: "usdc_sol",
    baseCurrencyCode: "usd",
    externalCustomerId: "openclawd-hackathon",
    showWalletAddressForm: "false",
    lockAmount: "false",
  });
  if (config.moonPayMerchantId) params.set("merchantId", config.moonPayMerchantId);
  return `https://buy.moonpay.com?${params.toString()}`;
}

async function refreshMoonPayLink() {
  const amount = document.getElementById("moonpay-amount").value || "50";
  const response = await fetch("/api/moonpay/buy-link", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  const payload = await response.json();
  const link = document.getElementById("moonpay-link");
  if (payload?.url) {
    link.href = payload.url;
    link.textContent = `Fund ${payload.amountUsd} USD With MoonPay`;
  }
}

function updateCheckoutProtocols() {
  const productId = document.getElementById("checkout-product").value;
  const product = state.store.catalog.products.find((entry) => entry.id === productId);
  const protocolSelect = document.getElementById("checkout-protocol");
  protocolSelect.innerHTML = (product?.protocols || [])
    .map((protocol) => `<option value="${escapeHtml(protocol)}">${escapeHtml(protocol)}</option>`)
    .join("");
  updateCheckoutAssets();
}

function updateCheckoutAssets() {
  const productId = document.getElementById("checkout-product").value;
  const product = state.store.catalog.products.find((entry) => entry.id === productId);
  const assetSelect = document.getElementById("checkout-asset");
  const options = [
    { asset: product?.price?.asset || "USDC", label: `${product?.price?.amount || "0.10"} ${product?.price?.asset || "USDC"}` },
    ...(product?.clawdPrice
      ? [{ asset: "CLAWD", label: `${product.clawdPrice.amount} CLAWD` }]
      : []),
  ];
  assetSelect.innerHTML = options
    .map((option) => `<option value="${escapeHtml(option.asset)}">${escapeHtml(option.label)}</option>`)
    .join("");
}

async function createCheckoutSession() {
  const payload = {
    productId: document.getElementById("checkout-product").value,
    protocol: document.getElementById("checkout-protocol").value,
    asset: document.getElementById("checkout-asset").value,
    buyerName: document.getElementById("checkout-buyer-name").value,
    buyerEmail: document.getElementById("checkout-buyer-email").value,
  };

  const response = await fetch("/api/checkout/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!data?.session) return;
  state.currentSession = data.session;
  renderCheckoutSession();
}

async function fundCheckoutSession() {
  if (!state.currentSession?.id) return;
  const response = await fetch(`/api/checkout/session/${encodeURIComponent(state.currentSession.id)}/fund`, {
    method: "POST",
  });
  const data = await response.json();
  if (!data?.session) return;
  state.currentSession = data.session;
  renderCheckoutSession();
}

function renderCheckoutSession() {
  const sessionBox = document.getElementById("checkout-session");
  const fulfillmentBox = document.getElementById("checkout-fulfillment");
  const session = state.currentSession;
  if (!session) {
    sessionBox.textContent = "No session created yet.";
    fulfillmentBox.textContent = "Fund a session to reveal the artifact.";
    return;
  }

  sessionBox.innerHTML = [
    ["Session", session.id],
    ["Product", session.productTitle],
    ["Status", session.status],
    ["Protocol", session.protocol],
    ["Amount", `${session.amount} ${session.asset}`],
    ...(session.settlementMint ? [["Mint", session.settlementMint]] : []),
    ["Buyer", `${session.buyerName} <${session.buyerEmail}>`],
    ["MoonPay", session.moonPayUrl ? "ready" : "not configured"],
    ...(session.narrative || []).map((line, index) => [`Step ${index + 1}`, line]),
  ]
    .map(([label, value]) => `<div class="terminal-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`)
    .join("");

  if (session.moonPayUrl) {
    document.getElementById("moonpay-link").href = session.moonPayUrl;
    document.getElementById("moonpay-link").textContent = `Fund ${escapeHtml(session.amount)} ${escapeHtml(session.asset)} With MoonPay`;
  }

  fulfillmentBox.textContent = JSON.stringify(
    session.fulfillment || { preview: session.fulfillmentPreview },
    null,
    2,
  );
}

async function runGeminiAgent() {
  const output = document.getElementById("gemini-output");
  output.textContent = "Running Gemini...";
  const response = await fetch("/api/agents/gemini", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      prompt: document.getElementById("gemini-prompt").value,
    }),
  });
  const data = await response.json();
  output.textContent = JSON.stringify(data, null, 2);
}

async function runWalletBrief() {
  const output = document.getElementById("wallet-brief-output");
  output.textContent = "Running Helius wallet brief...";
  const response = await fetch("/api/agents/wallet-brief", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      wallet: document.getElementById("wallet-brief-input").value,
    }),
  });
  const data = await response.json();
  output.textContent = JSON.stringify(data, null, 2);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function humanize(value) {
  return String(value)
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function loadX402() {
  const statusBox = document.getElementById("x402-store-status");
  statusBox.textContent = "connecting…";
  const [infoRes, registryRes, agentsRes] = await Promise.all([
    fetch("/api/x402wtf/info"),
    fetch("/api/x402wtf/registry"),
    fetch("/api/x402wtf/agents"),
  ]);
  state.x402Info = await infoRes.json();
  const registryJson = await registryRes.json().catch(() => ({}));
  const agentsJson = await agentsRes.json().catch(() => ({}));
  state.x402Registry = registryJson.registry || registryJson;
  state.x402Agents = agentsJson.agents || null;

  renderX402StoreInfo();
  renderX402Registry();
  renderX402CheckoutForm();

  statusBox.textContent = state.x402Info?.registration?.status
    ? `registered · ${state.x402Info.registration.merchantId}`
    : "registered";
}

function renderX402StoreInfo() {
  const box = document.getElementById("x402-store-info");
  if (!state.x402Info) {
    box.textContent = "x402.wtf connection unavailable.";
    return;
  }
  const info = state.x402Info;
  const rows = [
    ["Provider", info.provider],
    ["Mode", info.mode],
    ["Payments", info.payments],
    ["Registry", info.registry],
    ["Agent Chat", info.agentChat],
    ["Public Key", info.publicKey],
    ["Settlement Asset", info.settlementAsset],
    ["Network", info.network],
    ["Store Operator Wallet", info.storeOperatorWallet || "set X402_STORE_WALLET"],
    ["Fee Payer Wallet", info.feePayerWallet || "set X402_FEE_PAYER_WALLET"],
    ["Merchant Id", info.registration?.merchantId || "openclawd-merchant"],
    ["Products Wired", String(info.products || 0)],
  ];
  box.innerHTML = rows
    .map(([label, value]) => `<div class="terminal-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`)
    .join("");
}

function renderX402Registry() {
  const out = document.getElementById("x402-registry-output");
  const info = state.x402Info;
  const live = state.x402Registry;
  if (!info) {
    out.textContent = "x402.wtf registry not loaded.";
    return;
  }
  if (live && (live.merchantId || live.publicKey || live.name)) {
    out.textContent = JSON.stringify(live, null, 2);
    return;
  }
  out.textContent = JSON.stringify(
    {
      merchantId: info.registration?.merchantId,
      registry: info.registry,
      publicKey: info.publicKey,
      settlementAsset: info.settlementAsset,
      network: info.network,
      storefrontPath: info.registration?.storefrontPath,
      checkoutPath: info.registration?.checkoutPath,
      revalidateAfter: info.registration?.revalidateAfter,
    },
    null,
    2,
  );
}

function renderX402CheckoutForm() {
  const productSelect = document.getElementById("x402-product");
  if (!productSelect) return;
  productSelect.innerHTML = (state.store.catalog.products || [])
    .map((product) => `<option value="${escapeHtml(product.id)}">${escapeHtml(product.title)} · ${escapeHtml(product.price.amount)} ${escapeHtml(product.price.asset)}</option>`)
    .join("");
  productSelect.addEventListener("change", updateX402Assets);
  updateX402Assets();
}

function updateX402Assets() {
  const productId = document.getElementById("x402-product").value;
  const product = state.store.catalog.products.find((entry) => entry.id === productId);
  const assetSelect = document.getElementById("x402-asset");
  if (!assetSelect || !product) return;
  const options = [
    { asset: product.price?.asset || "USDC", label: `${product.price?.amount || "0.10"} ${product.price?.asset || "USDC"}` },
    ...(product.clawdPrice ? [{ asset: "CLAWD", label: `${product.clawdPrice.amount} CLAWD` }] : []),
  ];
  assetSelect.innerHTML = options
    .map((option) => `<option value="${escapeHtml(option.asset)}">${escapeHtml(option.label)}</option>`)
    .join("");
}

function bindX402() {
  document.getElementById("x402-registry-register").addEventListener("click", registerX402Merchant);
  document.getElementById("x402-chat-run").addEventListener("click", sendX402Chat);
  document.getElementById("x402-create").addEventListener("click", createX402Session);
  document.getElementById("x402-verify").addEventListener("click", verifyX402Session);
}

async function registerX402Merchant() {
  const out = document.getElementById("x402-registry-output");
  out.textContent = "Registering merchant on x402.wtf...";
  try {
    const response = await fetch("/api/x402wtf/registry/register", { method: "POST" });
    const data = await response.json();
    out.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    out.textContent = `Registration failed: ${String(error)}`;
  }
}

async function sendX402Chat() {
  const out = document.getElementById("x402-chat-output");
  out.textContent = "Sending x402 agent chat...";
  const response = await fetch("/api/x402wtf/agent/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      agentId: document.getElementById("x402-chat-agent").value,
      message: document.getElementById("x402-chat-message").value,
    }),
  });
  const data = await response.json();
  out.textContent = JSON.stringify(data, null, 2);
}

async function createX402Session() {
  const out = document.getElementById("x402-session");
  out.textContent = "Creating x402 challenge...";
  const response = await fetch("/api/x402wtf/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      productId: document.getElementById("x402-product").value,
      asset: document.getElementById("x402-asset").value,
      buyerWallet: document.getElementById("x402-buyer-wallet").value,
      buyerName: document.getElementById("x402-buyer-name").value,
      buyerEmail: document.getElementById("x402-buyer-email").value,
    }),
  });
  const data = await response.json();
  if (!data?.session) {
    out.textContent = JSON.stringify(data, null, 2);
    return;
  }
  state.x402Session = data.session;
  renderX402Session();
}

async function verifyX402Session() {
  if (!state.x402Session?.id) return;
  const signature = document.getElementById("x402-signature").value.trim();
  if (!signature) {
    document.getElementById("x402-fulfillment").textContent = "Paste a payment-signature to verify.";
    return;
  }
  const response = await fetch(`/api/x402wtf/checkout/${encodeURIComponent(state.x402Session.id)}/verify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ paymentSignature: signature }),
  });
  const data = await response.json();
  if (data?.session) {
    state.x402Session = data.session;
    renderX402Session();
  } else {
    document.getElementById("x402-fulfillment").textContent = JSON.stringify(data, null, 2);
  }
}

function renderX402Session() {
  const sessionBox = document.getElementById("x402-session");
  const fulfillmentBox = document.getElementById("x402-fulfillment");
  const session = state.x402Session;
  if (!session) {
    sessionBox.textContent = "No x402 session created yet.";
    fulfillmentBox.textContent = "Verify the payment-signature to unlock the receipt.";
    return;
  }
  const rows = [
    ["Session", session.id],
    ["Product", session.productTitle],
    ["Status", session.status],
    ["Payments Endpoint", session.paymentsEndpoint],
    ["Registry", session.registryEndpoint],
    ["Upstream Status", String(session.upstreamStatus)],
    ["Buyer Wallet", session.buyerWallet || "not provided"],
    ["Amount", `${session.amount} ${session.asset}`],
    ...(session.settlementMint ? [["Mint", session.settlementMint]] : []),
    ...(session.narrative || []).map((line, index) => [`Step ${index + 1}`, line]),
  ];
  sessionBox.innerHTML = rows
    .map(([label, value]) => `<div class="terminal-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`)
    .join("");
  if (session.challenge) {
    sessionBox.innerHTML += `<div class="terminal-row"><span>Challenge</span><strong>${escapeHtml(JSON.stringify(session.challenge).slice(0, 120))}…</strong></div>`;
  }
  fulfillmentBox.textContent = JSON.stringify(
    session.fulfillment || { challenge: session.challenge, headers: session.upstreamHeaders },
    null,
    2,
  );
}
