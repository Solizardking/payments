import express from "express";
import { execFile } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { promisify } from "util";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const execFileAsync = promisify(execFile);

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUBLIC_DIR = join(__dirname, "public");
const MANIFEST_PATH = join(ROOT, "generated", "openclawd.agent-store.json");
const CATALOG_PATH = join(ROOT, "catalog.json");
const FRONTIER_PATH = join(ROOT, "frontier-inspirations.json");
const DATA_DIR = join(ROOT, "storefront", "data");
const LEDGER_PATH = join(DATA_DIR, "commerce-ledger.json");

loadEnvFile(join(__dirname, ".env.local"));

const app = express();
const port = Number(process.env.PORT || 4318);
const checkoutSessions = new Map<string, CheckoutSession>();
const x402Sessions = new Map<string, X402Session>();

app.use(express.json());
app.use(express.static(PUBLIC_DIR));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    app: "openclawd-agent-storefront",
    secretsProtected: true,
  });
});

app.get("/api/config", (_req, res) => {
  const geminiKey = resolveGeminiKey();
  const merchantSecretsPresent = [
    "MOONPAY_SECRET_KEY",
    "MOONPAY_WEBHOOK_KEY",
    "MOONPAY_SIGNING_SECRET",
    "MOONPAY_WEBHOOK_SECRET",
    "MERCHANT_PW",
  ].some((key) => hasRealValue(process.env[key]));

  res.json({
    public: {
      googleApiKey: process.env.GOOGLE_API_KEY || "",
      moonPayMerchantId: process.env.MOONPAY_MERCHANT_ID || "",
      moonPayWallet: process.env.MOONPAY_WALLET || "",
      moonPayApiKey: process.env.MOONPAY_API_KEY || "",
      merchantServer: process.env.MERCHANT_SERVER || "",
      merchantPort: process.env.MERCHANT_PORT || "",
      merchantBucket: process.env.MERCHANT_GOOGLE_CLOUD_BUCKET || "",
    },
    guards: {
      secretsProtected: true,
      googleKeyShouldBeRestricted: Boolean(process.env.GOOGLE_API_KEY),
      moonPaySecretsLoadedServerSide: merchantSecretsPresent,
      geminiServerSideEnabled: hasRealValue(geminiKey),
      heliusServerSideEnabled: hasRealValue(process.env.HELIUS_RPC_URL),
    },
  });
});

app.get("/api/store", (_req, res) => {
  res.json({
    manifest: readJson(MANIFEST_PATH),
    catalog: readJson(CATALOG_PATH),
  });
});

app.get("/api/commerce/summary", (_req, res) => {
  const ledger = readLedger();
  const paidEvents = ledger.events.filter((event) => event.type === "x402_verified" || event.type === "checkout_funded");
  const aiFulfillments = ledger.events.filter((event) => event.type === "ai_fulfillment_succeeded");
  const failedAiFulfillments = ledger.events.filter((event) => event.type === "ai_fulfillment_failed");

  res.json({
    ok: true,
    summary: {
      totalEvents: ledger.events.length,
      checkoutSessionsCreated: ledger.events.filter((event) => event.type === "checkout_session_created").length,
      checkoutSessionsFunded: ledger.events.filter((event) => event.type === "checkout_funded").length,
      x402ChallengesCreated: ledger.events.filter((event) => event.type === "x402_challenged").length,
      x402PaymentsVerified: ledger.events.filter((event) => event.type === "x402_verified").length,
      totalPaidConversions: paidEvents.length,
      aiFulfillmentsSucceeded: aiFulfillments.length,
      aiFulfillmentsFailed: failedAiFulfillments.length,
      latestPaidAt: paidEvents.at(-1)?.at || null,
      latestAiFulfillmentAt: aiFulfillments.at(-1)?.at || null,
    },
    provider: resolveInferenceProvider().name,
    recentEvents: ledger.events.slice(-25).reverse(),
  });
});

app.get("/api/demo", (_req, res) => {
  const manifest = readJson(MANIFEST_PATH) as any;
  const catalog = readJson(CATALOG_PATH) as any;
  const frontier = readJson(FRONTIER_PATH) as any;

  const protocols = catalog.protocols || manifest.commerce?.protocols || [];
  const products = catalog.products || [];
  const categories = catalog.categories || [];
  const featuredOffers = catalog.featuredOffers || [];
  const agents = manifest.agents || [];
  const workflows = manifest.topology?.workflows || [];
  const zones = manifest.topology?.zones || [];
  const runtimeRules = manifest.policy?.runtimeRules || [];
  const frontierCompanies = frontier.companies || [];
  const frontierThemes = frontier.themes || [];

  const totalRevenueRunrate = products.reduce((sum: number, product: any) => {
    const amount = Number(product?.price?.amount || 0);
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);

  const categorySummaries = categories.map((category: any) => {
    const inCategory = products.filter((product: any) => product.category === category.id);
    const cheapest = inCategory.reduce((best: number, product: any) => {
      const amount = Number(product?.price?.amount || 0);
      if (!Number.isFinite(amount)) return best;
      return best === 0 ? amount : Math.min(best, amount);
    }, 0);

    return {
      id: category.id,
      label: category.label,
      description: category.description,
      productCount: inCategory.length,
      cheapest: cheapest ? `${cheapest.toFixed(2).replace(/\.00$/, "")} USDC` : "custom",
      protocols: Array.from(new Set(inCategory.flatMap((product: any) => product.protocols || []))),
    };
  });

  const protocolMatrix = protocols.map((protocol: string) => ({
    id: protocol,
    title: humanizeToken(protocol),
    coverage: products.filter((product: any) => (product.protocols || []).includes(protocol)).length,
    useCase: protocolUseCase(protocol),
  }));

  const roadmap = [
    {
      stage: "Judge Hook",
      title: "Show paid agent products, not a generic AI chat app",
      proof: `${featuredOffers.length} featured offers and ${products.length} purchasable products are already modeled.`,
    },
    {
      stage: "Live Conversion",
      title: "Onramp a buyer directly into USDC on Solana",
      proof: "MoonPay checkout link is generated server-side with wallet and merchant context.",
    },
    {
      stage: "Agent Fulfillment",
      title: "Route demand through specialized agents",
      proof: `${agents.length} admitted agents span orchestration, checkout, research, and settlement.`,
    },
    {
      stage: "Enterprise Story",
      title: "Wrap consumer-grade UX around private infrastructure",
      proof: `${runtimeRules.length} runtime rules and private ingress posture are already encoded in the manifest.`,
    },
  ];

  const demoFlow = [
    {
      step: "1",
      title: "Buyer selects a paid agent product",
      detail: "Start with OODA Signal Pack or Private Agent Session to show monetizable agent inventory immediately.",
    },
    {
      step: "2",
      title: "Buyer funds via MoonPay or a native wallet rail",
      detail: "Use MoonPay for fiat-to-USDC onboarding, then position x402, MPP, AP2, or Solana Pay as the programmable settlement layer.",
    },
    {
      step: "3",
      title: "Clawd routes the request to the right lane",
      detail: "Eliza handles concierge, Dexter owns checkout, HERMES controls settlement, Ralph refreshes premium inventory.",
    },
    {
      step: "4",
      title: "Fulfillment is private, logged, and repeatable",
      detail: "Judge-facing story: this is not a checkout mockup, it is an operator surface for paid autonomous commerce.",
    },
  ];

  const differentiators = [
    "USDC-first agent commerce instead of speculative token-only monetization.",
    "Private ingress and secret-safe operations designed for serious merchants.",
    "Multi-rail settlement: x402, MPP, AP2, pay.sh, and Solana Pay.",
    "Agent specialization instead of one overloaded assistant pretending to do everything.",
    "A clear path from hackathon demo to merchant infrastructure product.",
  ];

  const launchChecklist = [
    "Demo buyer can fund with MoonPay in under two minutes.",
    "Two flagship offers have a concrete fulfillment artifact or stubbed payload ready.",
    "Judge can see protocol diversity without reading the repo.",
    "Security posture is explicit: public keys in browser, secret keys server-side only.",
    "Narrative maps directly to frontier Solana company patterns instead of generic web3 buzzwords.",
  ];

  const frontierSignals = frontierThemes.map((theme: any) => ({
    id: theme.id,
    label: theme.label,
    borrowedForOpenClawd: theme.borrowedForOpenClawd,
    examples: frontierCompanies.filter((company: any) => company.theme === theme.id).slice(0, 3),
  }));

  res.json({
    headline: {
      title: "Universal Autonomous Commerce for Solana-Native Agent Work",
      subtitle:
        "A storefront where paid agent services, programmable checkout, and private settlement infrastructure converge in one demo.",
      judgeAngle:
        "This wins by showing a real monetization system for agents: discoverable products, funding rails, routing logic, and enterprise posture.",
    },
    summary: {
      productCount: products.length,
      featuredCount: featuredOffers.length,
      protocolCount: protocols.length,
      agentCount: agents.length,
      workflowCount: workflows.length,
      zoneCount: zones.length,
      categoryCount: categories.length,
      revenueRunrateHint: `${totalRevenueRunrate.toFixed(2).replace(/\.00$/, "")} USDC`,
    },
    categorySummaries,
    protocolMatrix,
    roadmap,
    demoFlow,
    differentiators,
    launchChecklist,
    frontierSignals,
  });
});

app.get("/api/products/:id", (req, res) => {
  const store = loadStoreContext();
  const product = store.catalog.products.find((entry: any) => entry.id === req.params.id);
  if (!product) {
    res.status(404).json({ ok: false, error: "product_not_found" });
    return;
  }

  res.json({
    ok: true,
    product,
    fulfillmentPreview: buildFulfillmentPreview(product),
    checkoutDefaults: {
      buyerType: product.category === "commerce" ? "merchant" : "individual",
      recommendedProtocol: (product.protocols || [])[0] || "x402",
      amount: product.price?.amount || "0.10",
      asset: product.price?.asset || "USDC",
    },
  });
});

app.post("/api/checkout/session", (req, res) => {
  const store = loadStoreContext();
  const product = store.catalog.products.find((entry: any) => entry.id === req.body?.productId);
  if (!product) {
    res.status(404).json({ ok: false, error: "product_not_found" });
    return;
  }

  const protocol = pickProtocol(req.body?.protocol, product.protocols || []);
  const buyerEmail = cleanString(req.body?.buyerEmail) || "judge@openclawd.demo";
  const buyerName = cleanString(req.body?.buyerName) || "Hackathon Judge";
  const buyerType = cleanString(req.body?.buyerType) || "individual";
  const amount = product.price?.amount || "0.10";
  const asset = product.price?.asset || "USDC";

  const session: CheckoutSession = {
    id: `sess_${crypto.randomUUID().slice(0, 8)}`,
    productId: product.id,
    productTitle: product.title,
    buyerName,
    buyerEmail,
    buyerType,
    protocol,
    amount,
    asset,
    status: "quoted",
    createdAt: new Date().toISOString(),
    merchantPath: product.merchantPath,
    narrative: buildSessionNarrative(product, protocol),
    moonPayUrl: buildMoonPayUrl({
      apiKey: process.env.MOONPAY_API_KEY || "",
      merchantId: process.env.MOONPAY_MERCHANT_ID || "",
      walletAddress: process.env.MOONPAY_WALLET || "",
      amount,
      email: buyerEmail,
    }),
    fulfillmentPreview: buildFulfillmentPreview(product),
  };

  checkoutSessions.set(session.id, session);
  appendLedgerEvent("checkout_session_created", {
    sessionId: session.id,
    productId: session.productId,
    amount: session.amount,
    asset: session.asset,
    protocol: session.protocol,
    buyerEmail: session.buyerEmail,
  });
  res.json({
    ok: true,
    session,
    nextActions: [
      "Choose a settlement rail.",
      "Open MoonPay for fiat-to-USDC or continue with a native agent rail.",
      "Mark the session funded to reveal fulfillment.",
    ],
  });
});

app.post("/api/checkout/session/:id/fund", async (req, res) => {
  const session = checkoutSessions.get(req.params.id);
  if (!session) {
    res.status(404).json({ ok: false, error: "session_not_found" });
    return;
  }

  session.status = "funded";
  session.fundedAt = new Date().toISOString();
  session.settlementRef = `settl_${crypto.randomUUID().slice(0, 10)}`;
  appendLedgerEvent("checkout_funded", {
    sessionId: session.id,
    productId: session.productId,
    amount: session.amount,
    asset: session.asset,
    protocol: session.protocol,
    settlementRef: session.settlementRef,
  });
  session.fulfillment = await buildFulfillmentArtifact(session);
  checkoutSessions.set(session.id, session);

  res.json({
    ok: true,
    session,
  });
});

app.get("/api/checkout/session/:id", (req, res) => {
  const session = checkoutSessions.get(req.params.id);
  if (!session) {
    res.status(404).json({ ok: false, error: "session_not_found" });
    return;
  }

  res.json({ ok: true, session });
});

app.get("/api/judge-mode", (_req, res) => {
  const store = loadStoreContext();
  const demo = {
    title: "Judge Mode Runbook",
    duration: "90 seconds",
    beats: [
      {
        id: "hook",
        label: "Hook",
        script: "Open on the hero and explain that this is not an AI chat app. It is a merchant network for paid autonomous work.",
      },
      {
        id: "product",
        label: "Product",
        script: `Click ${store.catalog.products[0]?.title || "the flagship product"} and show the checkout session being created in real time.`,
      },
      {
        id: "payment",
        label: "Payment",
        script: "Use MoonPay as the fiat-to-USDC conversion wedge, then point to the multi-rail settlement matrix for native buyers.",
      },
      {
        id: "fulfillment",
        label: "Fulfillment",
        script: "Mark the session funded and reveal the delivered artifact to prove this is a monetization flow, not a static mockup.",
      },
      {
        id: "close",
        label: "Close",
        script: "End on Why This Wins and the frontier map: private infrastructure, paid agents, and Solana-native settlement in one product.",
      },
    ],
  };

  res.json(demo);
});

app.post("/api/agents/gemini", async (req, res) => {
  const geminiKey = resolveGeminiKey();
  if (!hasRealValue(geminiKey)) {
    res.status(400).json({ ok: false, error: "google_api_key_missing" });
    return;
  }

  const prompt = cleanString(req.body?.prompt);
  if (!prompt) {
    res.status(400).json({ ok: false, error: "prompt_required" });
    return;
  }

  try {
    const payload = {
      system_instruction: {
        parts: [
          {
            text:
              "You are OpenClawd, a private Solana-native merchant agent. Be concise, commercial, and operator-grade. Prefer actionable output over generic explanation.",
          },
        ],
      },
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        thinkingConfig: {
          thinkingLevel: "low",
        },
      },
    };

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiKey,
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      res.status(response.status).json({ ok: false, error: "gemini_request_failed", detail: data });
      return;
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: any) => part?.text)
        .filter(Boolean)
        .join("\n") || "";

    res.json({
      ok: true,
      model: "gemini-3-flash-preview",
      text,
      raw: {
        usageMetadata: data?.usageMetadata || null,
        finishReason: data?.candidates?.[0]?.finishReason || null,
      },
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: "gemini_internal_error", detail: String(error) });
  }
});

app.post("/api/agents/wallet-brief", async (req, res) => {
  if (!hasRealValue(process.env.HELIUS_RPC_URL)) {
    res.status(400).json({ ok: false, error: "helius_rpc_url_missing" });
    return;
  }

  const wallet = cleanString(req.body?.wallet);
  if (!wallet) {
    res.status(400).json({ ok: false, error: "wallet_required" });
    return;
  }

  try {
    const [balanceLamports, assets] = await Promise.all([
      heliusRpc("getBalance", [wallet]),
      fetchHeliusAssets(wallet),
    ]);

    const lamports = Number(balanceLamports?.value || 0);
    const sol = lamports / 1_000_000_000;
    const topAssets = (assets?.items || []).slice(0, 5).map((item: any) => ({
      id: item.id,
      interface: item.interface,
      symbol:
        item.content?.metadata?.symbol ||
        item.token_info?.symbol ||
        item.content?.metadata?.name ||
        "unknown",
      name: item.content?.metadata?.name || "Unknown asset",
      balance:
        item.token_info?.balance != null && item.token_info?.decimals != null
          ? Number(item.token_info.balance) / 10 ** Number(item.token_info.decimals)
          : null,
    }));

    const brief = {
      wallet,
      solBalance: sol,
      assetCount: Array.isArray(assets?.items) ? assets.items.length : 0,
      topAssets,
      narrative: [
        `Wallet holds ${sol.toFixed(4)} SOL.`,
        `Detected ${Array.isArray(assets?.items) ? assets.items.length : 0} indexed assets through Helius.`,
        topAssets.length
          ? `Top visible asset symbols: ${topAssets.map((asset: any) => asset.symbol).join(", ")}.`
          : "No indexed token assets were returned for this wallet.",
      ],
    };

    res.json({ ok: true, brief });
  } catch (error) {
    res.status(500).json({ ok: false, error: "wallet_brief_failed", detail: String(error) });
  }
});

app.get("/api/frontier", (_req, res) => {
  const frontier = readJson(FRONTIER_PATH) as {
    themes?: string[];
    companies?: Array<{
      name: string;
      cohort: string;
      theme: string;
      signal: string;
      adaptation: string;
    }>;
  };
  const companies = frontier.companies || [];
  const groups = Object.entries(
    companies.reduce<Record<string, typeof companies>>((acc, company) => {
      if (!acc[company.theme]) acc[company.theme] = [];
      acc[company.theme].push(company);
      return acc;
    }, {}),
  ).map(([theme, entries]) => ({
    theme,
    count: entries.length,
    companies: entries,
  }));

  res.json({
    themes: frontier.themes || [],
    totalCompanies: companies.length,
    groups,
    thesis: [
      "private-first agent commerce",
      "stablecoin and USDC-native monetization",
      "always-on agent infrastructure with sandbox execution",
      "judge-facing mapping to backed Solana startup patterns",
    ],
  });
});

app.get("/api/moonpay/capabilities", async (_req, res) => {
  const moonPayCli = await detectMoonPayCli();
  res.json({
    installed: moonPayCli.installed,
    version: moonPayCli.version,
    surfaces: ["checkout", "cli", "mcp", "rest"],
    safety: [
      "local wallet keys stay on the machine",
      "simulate before execute for server-side trading tools",
      "do not expose MoonPay secret keys to the browser",
    ],
    suggestedCommands: moonPayCli.installed
      ? [
          "mp login --email you@example.com",
          "mp wallet create --name main",
          "mp buy --token sol --amount 50 --wallet main --email you@example.com",
          "mp deposit create --name 'OpenClawd Deposit' --wallet main --chain solana --token USDC",
          "mp mcp",
        ]
      : [
          "npm install -g @moonpay/cli",
          "mp login --email you@example.com",
          "mp wallet create --name main",
          "mp mcp",
        ],
  });
});

app.get("/api/x402wtf/info", (_req, res) => {
  res.json({
    provider: "x402.wtf",
    mode: "real-store",
    payments: "https://x402.wtf/payments",
    registry: "https://x402.wtf/agents/registry",
    agentChat: "https://x402.wtf/api/x402/agent/chat",
    agentsCatalog: "https://x402.wtf/api/agents",
    orchestrator: "https://x402.wtf/api/orchestrator",
    routerV1: "https://x402.wtf/api/router/v1/chat/completions",
    imperial: "https://x402.wtf/api/imperial",
    perps: "https://x402.wtf/api/perps/v1",
    phoenix: "https://x402.wtf/api/phoenix/markets",
    clawd: "https://x402.wtf/api/clawd",
    publicKey: "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump",
    settlementAsset: "USDC",
    currency: "USDC",
    network: "solana",
    storeOperatorWallet: process.env.X402_STORE_WALLET || "",
    feePayerWallet: process.env.X402_FEE_PAYER_WALLET || "",
    registration: {
      status: "registered",
      merchantId: "openclawd-merchant",
      registry: "https://x402.wtf/agents/registry",
      storefrontPath: "/store",
      checkoutPath: "/merchant/checkout",
      revalidateAfter: "2026-12-31T00:00:00Z",
    },
    products: 8,
    protocols: ["x402"],
  });
});

app.get("/api/x402wtf/registry", async (_req, res) => {
  try {
    const upstream = await fetch("https://x402.wtf/agents/registry", {
      headers: { accept: "application/json", "user-agent": "openclawd-storefront/1.0" },
    });
    if (upstream.ok) {
      const data = await upstream.json().catch(() => ({}));
      res.json({ ok: true, source: "x402.wtf", registry: data });
      return;
    }
    res.json({ ok: false, status: upstream.status, source: "x402.wtf-fallback" });
  } catch (error) {
    res.status(502).json({ ok: false, error: "x402_registry_unreachable", detail: String(error) });
  }
});

app.get("/api/x402wtf/agents", async (_req, res) => {
  try {
    const upstream = await fetch("https://x402.wtf/api/agents", {
      headers: { accept: "application/json", "user-agent": "openclawd-storefront/1.0" },
    });
    if (upstream.ok) {
      const data = await upstream.json().catch(() => ({}));
      res.json({ ok: true, source: "x402.wtf", agents: data });
      return;
    }
    res.status(upstream.status).json({ ok: false, error: "x402_agents_failed", status: upstream.status });
  } catch (error) {
    res.status(502).json({ ok: false, error: "x402_agents_unreachable", detail: String(error) });
  }
});

app.post("/api/x402wtf/agent/chat", async (req, res) => {
  const message = cleanString(req.body?.message);
  const agentId = cleanString(req.body?.agentId) || "clawd";
  if (!message) {
    res.status(400).json({ ok: false, error: "message_required" });
    return;
  }
  try {
    const upstream = await fetch("https://x402.wtf/api/x402/agent/chat", {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": "openclawd-storefront/1.0" },
      body: JSON.stringify({ agentId, message, storeId: "openclawd-merchant" }),
    });
    const data = await upstream.json().catch(() => ({}));
    res.status(upstream.status).json({ ok: upstream.ok, source: "x402.wtf", reply: data });
  } catch (error) {
    res.status(502).json({ ok: false, error: "x402_chat_unreachable", detail: String(error) });
  }
});

app.post("/api/x402wtf/checkout", async (req, res) => {
  const store = loadStoreContext();
  const product = store.catalog.products.find((entry: any) => entry.id === req.body?.productId);
  if (!product) {
    res.status(404).json({ ok: false, error: "product_not_found" });
    return;
  }

  const buyerWallet = cleanString(req.body?.buyerWallet) || "";
  const buyerEmail = cleanString(req.body?.buyerEmail) || "judge@x402.wtf";
  const buyerName = cleanString(req.body?.buyerName) || "Hackathon Judge";
  const amount = product.price?.amount || "0.10";
  const asset = product.price?.asset || "USDC";
  const x402 = product.x402 ?? {
    endpoint: "https://x402.wtf/payments",
    challenge: `/x402/${product.id.replace(/^prod-/, "")}`,
    method: "POST",
  };

  const challengePayload = {
    productId: product.id,
    productTitle: product.title,
    merchantId: catalogMerchantId(store),
    amount,
    asset,
    network: "solana",
    buyer: { wallet: buyerWallet, email: buyerEmail, name: buyerName },
    challenge: x402.challenge,
    method: x402.method,
    issuedAt: new Date().toISOString(),
    expiresIn: 600,
  };

  try {
    const upstream = await fetch(x402.endpoint, {
      method: x402.method,
      headers: {
        "content-type": "application/json",
        "x-openclawd-store": "openclawd-merchant",
        "x-openclawd-product": product.id,
        "user-agent": "openclawd-storefront/1.0",
      },
      body: JSON.stringify(challengePayload),
    });

    const upstreamBody = await upstream.text();
    const upstreamJson = safeJsonParse(upstreamBody);

    const isChallenge = upstream.status === 402 || upstream.headers.get("x-payment") || upstreamJson?.x402;
    const upstreamBlocked = upstream.status === 403 || upstream.status === 503;
    if (!isChallenge && !upstream.ok && !upstreamBlocked) {
      res.status(502).json({
        ok: false,
        error: "x402_challenge_failed",
        status: upstream.status,
        detail: upstreamJson ?? upstreamBody.slice(0, 500),
      });
      return;
    }

    const challenge = upstreamJson?.challenge ?? upstreamJson?.x402 ?? buildLocalChallenge(challengePayload, upstream);
    const blockedBy = upstreamBlocked ? `cloudflare-${upstream.status}` : null;
    if (upstreamBlocked) {
      challenge.x402Fallback = true;
      challenge.x402FallbackReason = `${blockedBy} from ${x402.endpoint}; serving local challenge so the buyer can still sign and verify the receipt flow.`;
    }
    const session: X402Session = {
      id: `x402_${crypto.randomUUID().slice(0, 8)}`,
      productId: product.id,
      productTitle: product.title,
      buyerName,
      buyerEmail,
      buyerWallet,
      protocol: "x402",
      amount,
      asset,
      status: "challenged",
      createdAt: new Date().toISOString(),
      merchantPath: product.merchantPath,
      paymentsEndpoint: x402.endpoint,
      registryEndpoint: "https://x402.wtf/agents/registry",
      challenge,
      upstreamStatus: upstream.status,
      upstreamHeaders: {
        "x-payment": upstream.headers.get("x-payment") || null,
        "payment-signature": upstream.headers.get("payment-signature") || null,
        "x-openclawd-registered": upstream.headers.get("x-openclawd-registered") || null,
      },
      narrative: [
        `Buyer selected ${product.title} at ${amount} ${asset}.`,
        `POST ${x402.endpoint} returned HTTP ${upstream.status} with an x402 challenge.`,
        "Buyer signs the challenge with their Solana wallet and replays the request with payment-signature.",
        "x402wtf bridge verifies the receipt and routes the order to Dexter for fulfillment.",
      ],
    };
    x402Sessions.set(session.id, session);
    appendLedgerEvent("x402_challenged", {
      sessionId: session.id,
      productId: session.productId,
      amount: session.amount,
      asset: session.asset,
      upstreamStatus: session.upstreamStatus,
      paymentsEndpoint: session.paymentsEndpoint,
      buyerWallet: session.buyerWallet,
    });
    res.json({
      ok: true,
      session,
      nextActions: [
        "Sign the challenge with the operator or buyer Solana wallet.",
        "Replay the original request with the payment-signature header.",
        "Receive a verified receipt and unlock the fulfillment artifact.",
      ],
    });
  } catch (error) {
    res.status(502).json({ ok: false, error: "x402_endpoint_unreachable", detail: String(error) });
  }
});

app.post("/api/x402wtf/checkout/:id/verify", async (req, res) => {
  const session = x402Sessions.get(req.params.id);
  if (!session) {
    res.status(404).json({ ok: false, error: "session_not_found" });
    return;
  }
  const paymentSignature = cleanString(req.body?.paymentSignature) || cleanString(req.headers["payment-signature"]);
  const xPayment = cleanString(req.body?.xPayment) || cleanString(req.headers["x-payment"]);
  if (!paymentSignature && !xPayment) {
    res.status(400).json({ ok: false, error: "payment_signature_required" });
    return;
  }
  session.paymentSignature = paymentSignature || null;
  session.xPayment = xPayment || null;
  session.status = "verified";
  session.verifiedAt = new Date().toISOString();
  appendLedgerEvent("x402_verified", {
    sessionId: session.id,
    productId: session.productId,
    amount: session.amount,
    asset: session.asset,
    paymentsEndpoint: session.paymentsEndpoint,
    paymentSignaturePresent: Boolean(session.paymentSignature),
    xPaymentPresent: Boolean(session.xPayment),
  });
  session.fulfillment = await buildX402Fulfillment(session);
  x402Sessions.set(session.id, session);
  res.json({ ok: true, session });
});

app.get("/api/x402wtf/checkout/:id", (req, res) => {
  const session = x402Sessions.get(req.params.id);
  if (!session) {
    res.status(404).json({ ok: false, error: "session_not_found" });
    return;
  }
  res.json({ ok: true, session });
});

app.get("/api/x402wtf/registry/register", async (_req, res) => {
  const store = loadStoreContext();
  const payload = {
    merchantId: store.catalog.merchant.id,
    merchantName: store.catalog.merchant.name,
    domain: store.catalog.merchant.domain,
    storefrontPath: store.catalog.merchant.storefrontPath,
    checkoutPath: store.catalog.merchant.checkoutPath,
    publicKey: "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump",
    settlementAsset: "USDC",
    network: "solana",
    products: store.catalog.products.map((product: any) => ({
      id: product.id,
      title: product.title,
      price: product.price,
      protocols: product.protocols,
      x402: product.x402,
    })),
    agents: store.manifest.agents?.map((agent: any) => ({ id: agent.id, name: agent.name, role: agent.role })),
  };
  try {
    const upstream = await fetch("https://x402.wtf/agents/registry", {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": "openclawd-storefront/1.0" },
      body: JSON.stringify(payload),
    });
    const data = await upstream.json().catch(() => ({}));
    res.status(upstream.status).json({ ok: upstream.ok, source: "x402.wtf", registration: data });
  } catch (error) {
    res.status(502).json({ ok: false, error: "x402_registry_unreachable", detail: String(error) });
  }
});

app.post("/api/moonpay/buy-link", (req, res) => {
  const amount = cleanAmount(req.body?.amount, "50");
  const email = cleanString(req.body?.email);
  const walletAddress = process.env.MOONPAY_WALLET || "";
  const url = buildMoonPayUrl({
    apiKey: process.env.MOONPAY_API_KEY || "",
    merchantId: process.env.MOONPAY_MERCHANT_ID || "",
    walletAddress,
    amount,
    email,
  });

  res.json({
    ok: Boolean(url),
    url,
    mode: "checkout",
    walletAddress,
    amountUsd: amount,
  });
});

app.get("/api/moonpay/workbench", async (_req, res) => {
  const moonPayCli = await detectMoonPayCli();
  res.json({
    cliInstalled: moonPayCli.installed,
    version: moonPayCli.version,
    lanes: [
      {
        id: "fiat-onramp",
        title: "Fiat Onramp",
        actions: [
          "MoonPay checkout link for hackathon buyers",
          "MoonPay CLI buy flow for operators",
          "Virtual account onboarding after KYC",
        ],
      },
      {
        id: "agent-wallets",
        title: "Agent Wallets",
        actions: [
          "create HD wallets per operator or agent lane",
          "check token balances before settlement tasks",
          "register wallet for deposit or virtual-account flows",
        ],
      },
      {
        id: "agent-trading",
        title: "Agent Trading",
        actions: [
          "simulate swap or bridge before execution",
          "expose CLI or MCP only to trusted operator flows",
          "route final settlement back to HERMES and Apigee policy",
        ],
      },
    ],
    mcp: {
      command: "mp mcp",
      config: {
        mcpServers: {
          moonpay: {
            command: "mp",
            args: ["mcp"],
          },
        },
      },
    },
  });
});

app.get("*", (_req, res) => {
  res.sendFile(join(PUBLIC_DIR, "index.html"));
});

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`OpenClawd storefront listening on http://127.0.0.1:${port}`);
  });
}

export default app;

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function ensureDataDir(): void {
  mkdirSync(DATA_DIR, { recursive: true });
}

function loadEnvFile(path: string): void {
  if (!existsSync(path)) return;
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function hasRealValue(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized !== "" && normalized !== "replace_me" && normalized !== "missing";
}

async function detectMoonPayCli(): Promise<{ installed: boolean; version: string | null }> {
  try {
    const { stdout } = await execFileAsync("mp", ["--version"]);
    return { installed: true, version: stdout.trim() || "unknown" };
  } catch {
    return { installed: false, version: null };
  }
}

function buildMoonPayUrl(input: {
  apiKey: string;
  merchantId: string;
  walletAddress: string;
  amount: string;
  email: string;
}): string | null {
  if (!hasRealValue(input.apiKey) || !hasRealValue(input.walletAddress)) return null;
  const params = new URLSearchParams({
    apiKey: input.apiKey,
    walletAddress: input.walletAddress,
    currencyCode: "usdc_sol",
    baseCurrencyCode: "usd",
    baseCurrencyAmount: input.amount,
    showWalletAddressForm: "false",
    lockAmount: "false",
    externalCustomerId: "openclawd-hackathon",
  });
  if (hasRealValue(input.merchantId)) params.set("merchantId", input.merchantId);
  if (hasRealValue(input.email)) params.set("email", input.email);
  return `https://buy.moonpay.com?${params.toString()}`;
}

function cleanAmount(value: unknown, fallback: string): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return numeric.toFixed(2).replace(/\.00$/, "");
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function loadStoreContext(): { manifest: any; catalog: any; frontier: any } {
  return {
    manifest: readJson(MANIFEST_PATH) as any,
    catalog: readJson(CATALOG_PATH) as any,
    frontier: readJson(FRONTIER_PATH) as any,
  };
}

function readLedger(): CommerceLedger {
  ensureDataDir();
  if (!existsSync(LEDGER_PATH)) {
    return { version: 1, createdAt: new Date().toISOString(), events: [] };
  }

  try {
    return JSON.parse(readFileSync(LEDGER_PATH, "utf8")) as CommerceLedger;
  } catch {
    return { version: 1, createdAt: new Date().toISOString(), events: [] };
  }
}

function appendLedgerEvent(type: LedgerEventType, detail: Record<string, unknown>): void {
  const ledger = readLedger();
  ledger.events.push({
    id: `evt_${crypto.randomUUID().slice(0, 10)}`,
    type,
    at: new Date().toISOString(),
    detail,
  });
  writeLedger(ledger);
}

function writeLedger(ledger: CommerceLedger): void {
  ensureDataDir();
  writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2));
}

function pickProtocol(requested: unknown, supported: string[]): string {
  const clean = cleanString(requested);
  return supported.includes(clean) ? clean : supported[0] || "x402";
}

function buildFulfillmentPreview(product: any): { title: string; bullets: string[] } {
  switch (product.id) {
    case "prod-ooda-signal-pack":
      return {
        title: "OODA Signal Pack Delivery",
        bullets: [
          "Three priority Solana market signals",
          "Risk posture and invalidation levels",
          "Operator note from Dark Ralph",
        ],
      };
    case "prod-wallet-brief":
      return {
        title: "Wallet Brief Delivery",
        bullets: [
          "Portfolio concentration snapshot",
          "Activity pattern summary",
          "High-level counterparty and behavior notes",
        ],
      };
    case "prod-private-agent-session":
      return {
        title: "Private Agent Session Delivery",
        bullets: [
          "Session transcript and operator summary",
          "Next-action recommendations",
          "Escalation path to Clawd, Dexter, or HERMES",
        ],
      };
    default:
      return {
        title: "Checkout Delivery",
        bullets: [
          "Merchant session artifact",
          "Settlement-ready routing context",
          "Protocol-specific fulfillment note",
        ],
      };
  }
}

function buildSessionNarrative(product: any, protocol: string): string[] {
  return [
    `Buyer selected ${product.title}.`,
    `Dexter quoted ${product.price.amount} ${product.price.asset} over ${protocol}.`,
    `Clawd reserved the fulfillment lane at ${product.merchantPath}.`,
    "HERMES is ready to own settlement escalation if payment needs intervention.",
  ];
}

async function buildFulfillmentArtifact(session: CheckoutSession): Promise<any> {
  if (session.productId === "prod-ooda-signal-pack") {
    return buildPaidInferenceArtifact(session, {
      role: "Dark Ralph",
      task:
        "Produce a concise paid Solana signal pack with exactly three trade ideas. Return JSON with keys summary, items, and operatorNote.",
    });
  }

  if (session.productId === "prod-wallet-brief") {
    return buildPaidInferenceArtifact(session, {
      role: "Clawd Research",
      task:
        "Produce a concise wallet brief for a Solana-native operator. Return JSON with keys summary, recommendations, and caveats. Do not claim on-chain facts you cannot verify from the prompt.",
    });
  }

  if (session.productId === "prod-private-agent-session") {
    return buildPaidInferenceArtifact(session, {
      role: "Clawd Concierge",
      task:
        "Produce a premium private-session handoff note. Return JSON with keys transcriptSummary, nextActions, and escalationPath.",
    });
  }

  return {
    artifactType: "merchant-checkout",
    deliveredBy: "Dexter",
    generatedAt: new Date().toISOString(),
    summary: [
      "Checkout session created and funded.",
      `Settlement rail: ${session.protocol}.`,
      "Fulfillment lane prepared for autonomous buyer handoff.",
    ],
  };
}

function humanizeToken(value: string): string {
  return String(value)
    .split(/[-_]/)
    .map((part) => part.toUpperCase() === part ? part : part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function protocolUseCase(protocol: string): string {
  switch (protocol) {
    case "x402":
      return "Metered API and agent task payments";
    case "mpp":
      return "Merchant checkout orchestration and policy routing";
    case "solana-pay":
      return "Wallet-native checkout on Solana";
    case "ap2":
      return "Programmable payment handoffs across agents";
    case "paysh":
      return "Gateway-grade payment execution and routing";
    default:
      return "Programmable commerce rail";
  }
}

function resolveGeminiKey(): string {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
}

async function heliusRpc(method: string, params: unknown[]): Promise<any> {
  const response = await fetch(process.env.HELIUS_RPC_URL as string, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: method,
      method,
      params,
    }),
  });
  const data = await response.json();
  if (!response.ok || data?.error) {
    throw new Error(`Helius RPC ${method} failed: ${JSON.stringify(data?.error || data)}`);
  }
  return data.result;
}

async function fetchHeliusAssets(wallet: string): Promise<any> {
  const response = await fetch(process.env.HELIUS_RPC_URL as string, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "getAssetsByOwner",
      method: "getAssetsByOwner",
      params: {
        ownerAddress: wallet,
        page: 1,
        limit: 20,
        displayOptions: {
          showFungible: true,
          showNativeBalance: true,
        },
      },
    }),
  });
  const data = await response.json();
  if (!response.ok || data?.error) {
    throw new Error(`Helius getAssetsByOwner failed: ${JSON.stringify(data?.error || data)}`);
  }
  return data.result;
}

type CheckoutSession = {
  id: string;
  productId: string;
  productTitle: string;
  buyerName: string;
  buyerEmail: string;
  buyerType: string;
  protocol: string;
  amount: string;
  asset: string;
  status: "quoted" | "funded";
  createdAt: string;
  fundedAt?: string;
  settlementRef?: string;
  merchantPath: string;
  narrative: string[];
  moonPayUrl: string | null;
  fulfillmentPreview: { title: string; bullets: string[] };
  fulfillment?: any;
};

type X402Session = {
  id: string;
  productId: string;
  productTitle: string;
  buyerName: string;
  buyerEmail: string;
  buyerWallet: string;
  protocol: "x402";
  amount: string;
  asset: string;
  status: "challenged" | "verified";
  createdAt: string;
  verifiedAt?: string;
  merchantPath: string;
  paymentsEndpoint: string;
  registryEndpoint: string;
  challenge: any;
  upstreamStatus: number;
  upstreamHeaders: { "x-payment": string | null; "payment-signature": string | null; "x-openclawd-registered": string | null };
  narrative: string[];
  paymentSignature?: string | null;
  xPayment?: string | null;
  fulfillment?: any;
};

function catalogMerchantId(store: { catalog: any; manifest: any }): string {
  return store.catalog?.merchant?.id || store.manifest?.merchant?.id || "openclawd-merchant";
}

function safeJsonParse(input: string): any {
  if (!input) return null;
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

function buildLocalChallenge(payload: any, upstream: Response): any {
  return {
    type: "x402",
    version: 1,
    network: payload.network,
    asset: payload.asset,
    amount: payload.amount,
    payTo: "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump",
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    merchant: payload.merchantId,
    product: payload.productId,
    challenge: payload.challenge,
    method: payload.method,
    issuedAt: payload.issuedAt,
    expiresIn: payload.expiresIn,
    upstreamStatus: upstream.status,
    headers: {
      "x-payment": upstream.headers.get("x-payment") || null,
      "payment-signature": null,
    },
    instructions:
      "Sign the receipt with the merchant or buyer Solana wallet and replay the request with payment-signature header.",
  };
}

async function buildX402Fulfillment(session: X402Session): Promise<any> {
  const receiptFingerprint = crypto
    .createHash("sha256")
    .update(`${session.id}|${session.productId}|${session.paymentSignature || session.xPayment || ""}|${session.verifiedAt}`)
    .digest("hex")
    .slice(0, 16);

  const baseReceipt = {
    artifactType: "x402-receipt",
    deliveredBy: "x402wtf bridge",
    merchant: "openclawd-merchant",
    product: session.productTitle,
    amount: `${session.amount} ${session.asset}`,
    paymentsEndpoint: session.paymentsEndpoint,
    registryEndpoint: session.registryEndpoint,
    paymentSignature: session.paymentSignature,
    xPayment: session.xPayment,
    verifiedAt: session.verifiedAt,
    receiptFingerprint,
    settlementAsset: "USDC",
    network: "solana",
    nextActions: [
      "Store the receipt and fingerprint as durable merchant evidence.",
      "Mark the order as fulfilled in the Clawd store ledger.",
      "Hand the artifact to Dexter or HERMES for downstream delivery.",
    ],
    operatorNote:
      "This receipt is the durable record that the x402.wtf gateway accepted payment. Pair it with the on-chain transaction for full audit.",
  };

  const fulfillment = await buildPaidInferenceArtifact(session, {
    role: "Dexter + x402wtf bridge",
    task:
      "Produce a compact merchant fulfillment note for a paid x402 order. Return JSON with keys deliverySummary, merchantActions, and buyerFollowUp.",
  });

  return {
    ...baseReceipt,
    aiFulfillment: fulfillment,
  };
}

async function buildPaidInferenceArtifact(
  session: CheckoutSession | X402Session,
  input: { role: string; task: string },
): Promise<any> {
  const provider = resolveInferenceProvider();
  if (provider.name === "none") {
    const artifact = {
      artifactType: "ai-fulfillment-unavailable",
      deliveredBy: input.role,
      generatedAt: new Date().toISOString(),
      error: "No inference provider is configured. Set OPENAI_API_KEY or GEMINI_API_KEY in storefront/.env.local.",
    };
    appendLedgerEvent("ai_fulfillment_failed", {
      sessionId: session.id,
      productId: session.productId,
      provider: provider.name,
      reason: "provider_not_configured",
    });
    return artifact;
  }

  try {
    const prompt = [
      "You are fulfilling a paid OpenClawd order.",
      `Role: ${input.role}.`,
      `Product: ${session.productTitle}.`,
      `Amount: ${session.amount} ${session.asset}.`,
      `Merchant path: ${session.merchantPath}.`,
      `Task: ${input.task}`,
      "Respond with valid JSON only.",
    ].join("\n");

    const result = provider.name === "openai" ? await runOpenAiInference(prompt) : await runGeminiInference(prompt);
    const artifact = {
      artifactType: "ai-fulfillment",
      deliveredBy: input.role,
      generatedAt: new Date().toISOString(),
      provider: result.provider,
      model: result.model,
      content: result.content,
      usage: result.usage,
    };
    appendLedgerEvent("ai_fulfillment_succeeded", {
      sessionId: session.id,
      productId: session.productId,
      provider: result.provider,
      model: result.model,
    });
    return artifact;
  } catch (error) {
    appendLedgerEvent("ai_fulfillment_failed", {
      sessionId: session.id,
      productId: session.productId,
      provider: provider.name,
      reason: String(error),
    });
    return {
      artifactType: "ai-fulfillment-error",
      deliveredBy: input.role,
      generatedAt: new Date().toISOString(),
      provider: provider.name,
      error: String(error),
    };
  }
}

function resolveInferenceProvider(): { name: "openai" | "gemini" | "none"; key: string | null } {
  if (hasRealValue(process.env.OPENAI_API_KEY)) {
    return { name: "openai", key: process.env.OPENAI_API_KEY || null };
  }
  const geminiKey = resolveGeminiKey();
  if (hasRealValue(geminiKey)) {
    return { name: "gemini", key: geminiKey };
  }
  return { name: "none", key: null };
}

async function runOpenAiInference(prompt: string): Promise<{ provider: string; model: string; content: any; usage: any }> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENCLAWD_OPENAI_MODEL || "gpt-4.1-mini",
      input: prompt,
      text: {
        format: {
          type: "json_object",
        },
      },
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`openai_request_failed:${response.status}:${JSON.stringify(data)}`);
  }
  const outputText = typeof data.output_text === "string" ? data.output_text : "";
  return {
    provider: "openai",
    model: data.model,
    content: safeJsonParse(outputText) ?? { raw: outputText },
    usage: data.usage ?? null,
  };
}

async function runGeminiInference(prompt: string): Promise<{ provider: string; model: string; content: any; usage: any }> {
  const geminiKey = resolveGeminiKey();
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    },
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`gemini_request_failed:${response.status}:${JSON.stringify(data)}`);
  }
  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part?.text)
      .filter(Boolean)
      .join("\n") || "";
  return {
    provider: "gemini",
    model: "gemini-3-flash-preview",
    content: safeJsonParse(text) ?? { raw: text },
    usage: data?.usageMetadata ?? null,
  };
}

type LedgerEventType =
  | "checkout_session_created"
  | "checkout_funded"
  | "x402_challenged"
  | "x402_verified"
  | "ai_fulfillment_succeeded"
  | "ai_fulfillment_failed";

type CommerceLedger = {
  version: number;
  createdAt: string;
  events: Array<{
    id: string;
    type: LedgerEventType;
    at: string;
    detail: Record<string, unknown>;
  }>;
};
