import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { parseArgs } from "util";

type AgentRecord = {
  id: string;
  name: string;
  role: string;
  chains: string[];
  settlement: string[];
  endpoint?: string;
  registry?: string;
  agentChat?: string;
  publicKey?: string;
  notes?: string;
  x402wtf?: {
    registry: string;
    endpoint: string;
    model: string;
  };
};

type MerchantProduct = {
  id: string;
  title: string;
  category: string;
  description: string;
  price: { amount: string; asset: string };
  protocols: string[];
  merchantPath: string;
  digital: boolean;
  googleMerchant?: Record<string, string | boolean>;
  x402?: {
    endpoint: string;
    challenge: string;
    method: string;
  };
};

type PaymentGateway = {
  primary: {
    provider: string;
    endpoint: string;
    registry: string;
    agentChat: string;
    agentsCatalog: string;
    mode: string;
    storeOperatorWallet: string;
    feePayerWallet: string;
    publicKey: string;
    settlementAsset: string;
  };
  fallbacks: Array<{ provider: string; endpoint: string }>;
};

type Catalog = {
  protocols: string[];
  supportedChains: string[];
  paymentGateway?: PaymentGateway;
  merchant: {
    id: string;
    name: string;
    domain: string;
    storefrontPath: string;
    checkoutPath: string;
    brandColor: string;
    contactEmail: string;
    googleMerchant?: Record<string, unknown>;
  };
  categories: Array<{ id: string; label: string; description: string }>;
  featuredOffers: Array<{ id: string; category: string; label: string; protocol: string; price: string; endpoint?: string }>;
  products: MerchantProduct[];
};

type Registry = {
  store: {
    id: string;
    name: string;
    symbol: string;
    operator: string;
    description: string;
  };
  x402?: {
    registry: string;
    paymentGateway: string;
    agentChat: string;
    agentsCatalog: string;
    orchestrator: string;
    routerV1: string;
    imperialRouter: string;
    perpsV1: string;
    phoenixMarkets: string;
    clawdChat: string;
    publicKey: string;
    storeOperatorWallet: string;
    feePayerWallet: string;
  };
  admission: {
    allow: string[];
    deny: string[];
  };
  agents: AgentRecord[];
};

type RuntimeProfile = {
  lane: string;
  objective: string;
  sandbox: string;
  cadence: string;
  prompt: string;
  command: string;
  healthcheck: string;
  dependencies: string[];
  owns: string[];
};

const ROOT = new URL(".", import.meta.url);
const REGISTRY_PATH = new URL("./agents.json", ROOT);
const CATALOG_PATH = new URL("./catalog.json", ROOT);
const PRIVATE_PROXY_BUNDLE_PATH = process.env.OPENCLAWD_PRIVATE_PROXY_BUNDLE_PATH ?? "apigee/apiproxy";
const OPENCLAWD_GATEWAY_PATH = process.env.OPENCLAWD_GATEWAY_PATH ?? "private-gateway/x402/worker/src/index.ts";
const OPENCLAWD_FACILITATOR_PATH = process.env.OPENCLAWD_FACILITATOR_PATH ?? "private-facilitator/api/index.ts";
const OPENCLAWD_OODA_CMD = process.env.OPENCLAWD_OODA_CMD ?? "cd /path/to/solana-clawd && npm run ooda:fast";
const OPENCLAWD_GATEWAY_DEV_CMD =
  process.env.OPENCLAWD_GATEWAY_DEV_CMD ?? "cd /path/to/private-gateway && npm install && npx wrangler dev";
const OPENCLAWD_FACILITATOR_DEV_CMD =
  process.env.OPENCLAWD_FACILITATOR_DEV_CMD ?? "cd /path/to/private-facilitator && npm install && npm run dev";
const OPENCLAWD_MANIFEST_CMD = process.env.OPENCLAWD_MANIFEST_CMD ?? "npm run manifest";
const X402_PAYMENTS_ENDPOINT = process.env.X402_PAYMENTS_ENDPOINT ?? "https://x402.wtf/payments";
const X402_REGISTRY_ENDPOINT = process.env.X402_REGISTRY_ENDPOINT ?? "https://x402.wtf/agents/registry";
const X402_AGENT_CHAT_ENDPOINT = process.env.X402_AGENT_CHAT_ENDPOINT ?? "https://x402.wtf/api/x402/agent/chat";
const X402_AGENTS_CATALOG = process.env.X402_AGENTS_CATALOG ?? "https://x402.wtf/api/agents";
const X402_ORCHESTRATOR = process.env.X402_ORCHESTRATOR ?? "https://x402.wtf/api/orchestrator";
const X402_ROUTER_V1 = process.env.X402_ROUTER_V1 ?? "https://x402.wtf/api/router/v1/chat/completions";
const X402_IMPERIAL = process.env.X402_IMPERIAL ?? "https://x402.wtf/api/imperial";
const X402_PERPS_V1 = process.env.X402_PERPS_V1 ?? "https://x402.wtf/api/perps/v1";
const X402_PHOENIX_MARKETS = process.env.X402_PHOENIX_MARKETS ?? "https://x402.wtf/api/phoenix/markets";
const X402_CLAWD_CHAT = process.env.X402_CLAWD_CHAT ?? "https://x402.wtf/api/clawd";
const X402_PUBLIC_KEY = process.env.X402_PUBLIC_KEY ?? "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump";

function loadJson<T>(url: URL): T {
  return JSON.parse(readFileSync(url, "utf8")) as T;
}

function normalizeId(id: string): string {
  return id.trim().toLowerCase();
}

function requireAgent(registry: Registry, id: string): AgentRecord {
  const normalized = normalizeId(id);
  if (registry.admission.deny.includes(normalized)) {
    throw new Error(`agent '${normalized}' is explicitly denied by store policy`);
  }
  if (!registry.admission.allow.includes(normalized)) {
    throw new Error(`agent '${normalized}' is not on the autonomous store allowlist`);
  }
  const agent = registry.agents.find((entry) => entry.id === normalized);
  if (!agent) {
    throw new Error(`agent '${normalized}' is allowed but missing from registry`);
  }
  return agent;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function agentPrompt(agent: AgentRecord, catalog: Catalog, registry: Registry): string {
  const offers = catalog.featuredOffers.map((offer) => `${offer.label} (${offer.price} via ${offer.protocol})`).join("; ");
  const x402Hint = registry.x402
    ? `All paid traffic is routed through ${registry.x402.paymentGateway}. The store is registered at ${registry.x402.registry} and uses ${registry.x402.publicKey} as the public identity.`
    : "";
  switch (agent.id) {
    case "clawd":
      return `Operate the OpenClawd merchant store 24/7 as the master orchestrator. Keep the storefront live on x402.wtf, coordinate admitted agents, route high-intent buyers, and escalate payment or policy issues to HERMES. Featured offers: ${offers}. ${x402Hint}`;
    case "ralph":
      return `Operate as Dark Ralph inside the merchant fleet. Continuously produce paid Solana intelligence, monitor OODA opportunities, and package trade signals as premium store inventory without taking custody of funds. Publish signal packs through ${X402_PAYMENTS_ENDPOINT} so the catalog can charge via x402.`;
    case "dexter":
      return `Operate as Dexter, the merchant checkout executor. Convert buyer intent into x402, MPP, AP2, and Solana Pay purchase flows; guard against malformed checkout sessions; and keep the checkout lane conversion-focused. Always sign challenges via the x402.wtf bridge at ${X402_PAYMENTS_ENDPOINT}.`;
    case "eliza":
      return `Operate as Eliza, the always-on customer success and concierge agent. Triage pre-sales and post-sale questions, route product discovery, and hand buyers to Dexter when they are ready to transact. Use the x402.wtf agent chat at ${X402_AGENT_CHAT_ENDPOINT} for shared agent messaging.`;
    case "hermes":
      return `Operate as HERMES x402, the payment, compliance, and facilitator control plane. Supervise pay.sh-compatible settlement, gateway health, pricing policy, and confidential relay posture across the entire merchant fleet. The x402.wtf registry at ${X402_REGISTRY_ENDPOINT} is the source of truth for the store identity.`;
    case "x402wtf":
      return `Operate as the x402.wtf Bridge. Own the connection from OpenClawd to https://x402.wtf/payments. Generate x402 challenges, register the merchant at ${X402_REGISTRY_ENDPOINT}, verify payment-signature headers, and forward the receipt to the rest of the fleet. Never custody funds; always defer signing to the operator wallet configured via X402_STORE_WALLET.`;
    default:
      return `Join the Universal Autonomous Commerce store and support the merchant fleet.`;
  }
}

function runtimeProfile(agent: AgentRecord, manifestPath: string): RuntimeProfile {
  switch (agent.id) {
    case "clawd":
      return {
        lane: "control-plane",
        objective: "Global store orchestration, agent routing, and cross-lane escalation.",
        sandbox: "pay-sandbox",
        cadence: "continuous",
        prompt: "Store orchestrator",
        command: `pay --sandbox clawd "Load ${manifestPath} and run the Universal Autonomous Commerce control plane as Clawd. Use ${X402_AGENT_CHAT_ENDPOINT} for shared agent messaging."`,
        healthcheck: "store manifest can be loaded and routes are assigned",
        dependencies: ["gateway", "facilitator", "customer-success", "checkout", "x402wtf"],
        owns: ["merchant routing", "session coordination", "cross-agent escalation"],
      };
    case "ralph":
      return {
        lane: "market-intelligence",
        objective: "Generate premium Solana signal inventory and dark DeFi research products.",
        sandbox: "node-process",
        cadence: "250ms ticks",
        prompt: "OODA operator",
        command: OPENCLAWD_OODA_CMD,
        healthcheck: "ooda loop continues writing ticks without fatal errors",
        dependencies: ["control-plane"],
        owns: ["signal packs", "trading briefs", "inventory freshness"],
      };
    case "dexter":
      return {
        lane: "checkout",
        objective: "Run the programmable buyer checkout lane and convert intent into paid sessions via x402.wtf.",
        sandbox: "pay-sandbox",
        cadence: "continuous",
        prompt: "Checkout executor",
        command: `pay --sandbox clawd "Load ${manifestPath} and run Dexter checkout operations for the autonomous merchant store. Sign x402 challenges through ${X402_PAYMENTS_ENDPOINT}."`,
        healthcheck: "checkout sessions can be opened, quoted, and challenged via x402.wtf",
        dependencies: ["gateway", "facilitator", "control-plane", "x402wtf"],
        owns: ["quotes", "checkout", "merchant session execution"],
      };
    case "eliza":
      return {
        lane: "customer-success",
        objective: "Provide 24/7 concierge support, FAQs, routing, and white-glove product discovery via the x402.wtf agent chat.",
        sandbox: "pay-sandbox",
        cadence: "continuous",
        prompt: "Customer success concierge",
        command: `pay --sandbox clawd "Load ${manifestPath} and run Eliza concierge operations. Converse through ${X402_AGENT_CHAT_ENDPOINT}."`,
        healthcheck: "customer intents are triaged and handed to the correct lane",
        dependencies: ["control-plane", "x402wtf"],
        owns: ["customer support", "intake", "handoffs"],
      };
    case "hermes":
      return {
        lane: "payments",
        objective: "Own facilitator health, pricing policy, x402.wtf settlement, and sandbox payment posture.",
        sandbox: "pay-sandbox",
        cadence: "continuous",
        prompt: "Payments and facilitator supervisor",
        command: `pay --sandbox clawd "Load ${manifestPath} and run HERMES payment, facilitator, and policy supervision. The x402.wtf registry is at ${X402_REGISTRY_ENDPOINT}."`,
        healthcheck: "payment protocols are advertised and settlement is healthy",
        dependencies: ["gateway", "facilitator", "x402wtf"],
        owns: ["payment policy", "settlement", "facilitator escalation"],
      };
    case "x402wtf":
      return {
        lane: "x402-bridge",
        objective: "Bridge OpenClawd to x402.wtf as a real paid store. Issue challenges, register agents, verify receipts.",
        sandbox: "x402-sandbox",
        cadence: "continuous",
        prompt: "x402.wtf bridge",
        command: `pay --sandbox clawd "Load ${manifestPath} and run the x402.wtf bridge. Endpoint ${X402_PAYMENTS_ENDPOINT}, registry ${X402_REGISTRY_ENDPOINT}, agent chat ${X402_AGENT_CHAT_ENDPOINT}."`,
        healthcheck: "POST https://x402.wtf/payments returns 402 with a valid challenge and the merchant is registered at the x402.wtf registry",
        dependencies: ["payments", "checkout"],
        owns: ["x402 challenges", "agent registration", "payment-signature verification"],
      };
    default:
      return {
        lane: "general",
        objective: "Support the store.",
        sandbox: "pay-sandbox",
        cadence: "continuous",
        prompt: "General support agent",
        command: `pay --sandbox clawd "Load ${manifestPath} and support the autonomous merchant store."`,
        healthcheck: "agent remains responsive",
        dependencies: ["control-plane"],
        owns: ["general support"],
      };
  }
}

function buildManifest(registry: Registry, agents: AgentRecord[], catalog: Catalog) {
  const chains = unique(agents.flatMap((agent) => agent.chains));
  const protocols = unique(agents.flatMap((agent) => agent.settlement));
  const primaryGateway = catalog.paymentGateway?.primary;

  return {
    manifestVersion: "2.1",
    id: registry.store.id,
    name: registry.store.name,
    description: registry.store.description,
    operator: registry.store.operator,
    symbol: registry.store.symbol,
    x402: {
      registry: registry.x402?.registry ?? X402_REGISTRY_ENDPOINT,
      paymentGateway: registry.x402?.paymentGateway ?? X402_PAYMENTS_ENDPOINT,
      agentChat: registry.x402?.agentChat ?? X402_AGENT_CHAT_ENDPOINT,
      agentsCatalog: registry.x402?.agentsCatalog ?? X402_AGENTS_CATALOG,
      orchestrator: registry.x402?.orchestrator ?? X402_ORCHESTRATOR,
      routerV1: registry.x402?.routerV1 ?? X402_ROUTER_V1,
      imperialRouter: registry.x402?.imperialRouter ?? X402_IMPERIAL,
      perpsV1: registry.x402?.perpsV1 ?? X402_PERPS_V1,
      phoenixMarkets: registry.x402?.phoenixMarkets ?? X402_PHOENIX_MARKETS,
      clawdChat: registry.x402?.clawdChat ?? X402_CLAWD_CHAT,
      publicKey: registry.x402?.publicKey ?? X402_PUBLIC_KEY,
      storeOperatorWallet: registry.x402?.storeOperatorWallet ?? "${X402_STORE_WALLET}",
      feePayerWallet: registry.x402?.feePayerWallet ?? "${X402_FEE_PAYER_WALLET}",
      settlementAsset: primaryGateway?.settlementAsset ?? "USDC",
      mode: primaryGateway?.mode ?? "real-store",
    },
    merchant: catalog.merchant,
    commerce: {
      mode: "autonomous",
      serviceTier: "24x7x365",
      supportedChains: unique([...chains, ...catalog.supportedChains]),
      protocols: unique([...protocols, ...catalog.protocols]),
      paymentGateway: primaryGateway?.endpoint ?? X402_PAYMENTS_ENDPOINT,
      paymentGatewayProvider: primaryGateway?.provider ?? "x402.wtf",
      settlementAsset: primaryGateway?.settlementAsset ?? "USDC",
      confidentialRelay: true,
      facilitator: {
        gatewayRoute: "/facilitator/*",
        workerEntry: OPENCLAWD_GATEWAY_PATH,
        paymentDebugger: OPENCLAWD_FACILITATOR_PATH,
        x402wtf: {
          paymentsEndpoint: X402_PAYMENTS_ENDPOINT,
          registryEndpoint: X402_REGISTRY_ENDPOINT,
          agentChatEndpoint: X402_AGENT_CHAT_ENDPOINT,
        },
      },
      agentToAgent: {
        protocol: "google-a2a",
        endpoint: "/a2a/:id",
        settlement: ["x402", "mpp", "ap2", "paysh"],
        x402wtfRegistry: X402_REGISTRY_ENDPOINT,
      },
      privacyEdge: {
        provider: "apigee",
        proxyBundle: PRIVATE_PROXY_BUNDLE_PATH,
        ingress: "private-service-connect",
        perimeter: "vpc-service-controls",
        auth: ["VerifyAPIKey", "OAuthV2/JWT", "mTLS"],
        debugMasking: true,
        privateVariablesPrefix: "private.",
        forwardedX402Headers: ["x-payment", "payment-signature", "x-agent-assertion"],
      },
      tokenEconomy: {
        symbol: "$CLAWD",
        mint: "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump",
        settlement: "USDC first, CLAWD amplified, x402-challenged",
        utility: [
          "rebates for autonomous buyers and operator accounts",
          "priority routing for CLAWD-aligned agents",
          "buyback and treasury flywheel from paid agent work",
          "real-store registration on x402.wtf/agents/registry",
        ],
        truandBreed: {
          class: "truand",
          definition: "A keep-alive sandbox agent that earns USDC, keeps a CLAWD-denominated reputation, and autonomously maintains a merchant lane.",
          chargeModel: "x402 metered services with CLAWD-aware fee modifiers",
        },
      },
    },
    policy: {
      allowAgents: registry.admission.allow,
      denyAgents: registry.admission.deny,
      oneDeniedAgentExplicitlyBlocked: "zerobro",
      runtimeRules: [
        "all customer and merchant traffic is routed through admitted agents only",
        "payment-signing remains in pay sandbox or approved wallet flows",
        "HERMES owns payment escalation and facilitator health",
        "Apigee is the mandatory ingress for production northbound traffic",
        "trace/debug sessions must use debug masking and private.* variables for secrets",
        "x402 challenges are issued by the x402wtf bridge and verified before fulfillment",
        "the merchant is registered at x402.wtf/agents/registry and must remain in good standing",
      ],
    },
    topology: {
      zones: [
        {
          id: "storefront",
          title: "Storefront",
          responsibilities: ["product discovery", "customer support", "buyer routing"],
          agents: agents.filter((agent) => ["clawd", "eliza"].includes(agent.id)).map((agent) => agent.id),
        },
        {
          id: "commerce",
          title: "Checkout and Fulfillment",
          responsibilities: ["quotes", "checkout", "digital delivery", "A2A checkout"],
          agents: agents.filter((agent) => ["clawd", "dexter"].includes(agent.id)).map((agent) => agent.id),
        },
        {
          id: "payments",
          title: "Payment Control Plane",
          responsibilities: ["facilitator", "x402", "MPP", "AP2", "Solana Pay"],
          agents: agents.filter((agent) => ["hermes", "x402wtf"].includes(agent.id)).map((agent) => agent.id),
        },
        {
          id: "research",
          title: "Premium Inventory Generation",
          responsibilities: ["dark DeFi research", "signal generation", "inventory refresh"],
          agents: agents.filter((agent) => ["ralph"].includes(agent.id)).map((agent) => agent.id),
        },
      ],
      sites: [
        { id: "apigee-edge", type: "private-api-proxy", path: PRIVATE_PROXY_BUNDLE_PATH },
        { id: "gateway", type: "cloudflare-worker", path: OPENCLAWD_GATEWAY_PATH },
        { id: "facilitator", type: "embedded-facilitator", path: OPENCLAWD_FACILITATOR_PATH },
        { id: "merchant-store", type: "manifest", path: "generated/openclawd.agent-store.json" },
        { id: "x402-payments", type: "x402-payments", path: X402_PAYMENTS_ENDPOINT },
        { id: "x402-registry", type: "x402-registry", path: X402_REGISTRY_ENDPOINT },
        { id: "x402-agent-chat", type: "x402-agent-chat", path: X402_AGENT_CHAT_ENDPOINT },
      ],
      workflows: [
        "customer -> apigee -> eliza -> clawd -> dexter -> hermes -> facilitator",
        "agent buyer -> gateway /a2a -> hermes settlement -> dexter fulfillment",
        "ralph premium inventory -> catalog offer -> clawd storefront routing",
        "buyer -> x402.wtf/payments -> x402wtf bridge -> dexter fulfillment -> apigee receipt",
        "x402wtf registers the merchant on x402.wtf/agents/registry on boot and re-registers on config change",
      ],
    },
    agents: agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      role: agent.role,
      chains: agent.chains,
      settlement: agent.settlement,
      x402wtf: agent.x402wtf ?? null,
      endpoint: agent.endpoint ?? agent.x402wtf?.endpoint ?? null,
      registry: agent.registry ?? X402_REGISTRY_ENDPOINT,
      publicKey: agent.publicKey ?? X402_PUBLIC_KEY,
      runtime: runtimeProfile(agent, "./generated/openclawd.agent-store.json"),
      prompt: agentPrompt(agent, catalog, registry),
    })),
    categories: catalog.categories,
    featuredOffers: catalog.featuredOffers,
    products: catalog.products,
  };
}

function ensureOutputDir(...segments: string[]): string {
  const dir = join(ROOT.pathname, "generated", ...segments);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function buildSession(
  registry: Registry,
  catalog: Catalog,
  agents: AgentRecord[],
  manifestPath: string,
  sessionId: string,
) {
  const fleet = agents.map((agent) => {
    const runtime = runtimeProfile(agent, manifestPath);
    return {
      id: `${sessionId}:${agent.id}`,
      agentId: agent.id,
      name: agent.name,
      role: agent.role,
      lane: runtime.lane,
      sandbox: runtime.sandbox,
      cadence: runtime.cadence,
      objective: runtime.objective,
      command: runtime.command,
      prompt: agentPrompt(agent, catalog, registry),
      healthcheck: runtime.healthcheck,
      dependencies: runtime.dependencies,
      owns: runtime.owns,
    };
  });

  return {
    sessionId,
    createdAt: new Date().toISOString(),
    manifest: manifestPath,
    store: registry.store,
    x402: registry.x402 ?? null,
    merchant: catalog.merchant,
    payCommand: "pay --sandbox clawd",
    supervisor: {
      mode: "multi-agent-autonomous-merchant",
      uptimeObjective: "24/7/365",
      deniedAgents: registry.admission.deny,
      settlement: ["x402", "mpp", "solana-pay", "ap2", "paysh"],
      realStoreProvider: "x402.wtf",
      realStoreEndpoint: X402_PAYMENTS_ENDPOINT,
    },
    infrastructure: [
      {
        id: "apigee",
        description: "Private Apigee API edge with key enforcement, masking, and confidential ingress",
        command: `Deploy ${PRIVATE_PROXY_BUNDLE_PATH} to an Apigee environment with PSC + VPC Service Controls`,
        healthcheck: "proxy responds only through approved private ingress and authorized apps",
      },
      {
        id: "gateway",
        description: "Cloudflare Worker x402/MPP/AP2/A2A gateway",
        command: OPENCLAWD_GATEWAY_DEV_CMD,
        healthcheck: "GET /health returns ok=true",
      },
      {
        id: "facilitator",
        description: "Embedded payment debugger and local facilitator",
        command: OPENCLAWD_FACILITATOR_DEV_CMD,
        healthcheck: "GET /facilitator/supported returns protocol metadata",
      },
      {
        id: "store-manifest",
        description: "Generated merchant contract for the entire fleet",
        command: OPENCLAWD_MANIFEST_CMD,
        healthcheck: "generated manifest is present and current",
      },
      {
        id: "x402-bridge",
        description: "x402.wtf bridge that registers the merchant and issues paid challenges",
        command: `pay --sandbox clawd "Load ${manifestPath} and call POST ${X402_PAYMENTS_ENDPOINT} to register and challenge."`,
        healthcheck: `POST ${X402_PAYMENTS_ENDPOINT} returns 402 with a valid x402 challenge and the merchant appears at ${X402_REGISTRY_ENDPOINT}`,
      },
    ],
    fleet,
    handoffs: [
      "eliza -> clawd for high-intent or complex customer requests",
      "clawd -> dexter when a buyer is ready for checkout or fulfillment",
      "dexter -> hermes when a payment, protocol, or compliance edge case occurs",
      "hermes -> gateway/facilitator when settlement plumbing needs intervention",
      "apigee -> hermes when auth, quota, masking, or perimeter controls fail",
      "buyer -> x402wtf bridge -> dexter fulfillment -> apigee receipt",
    ],
    prompt: "Run the OpenClawd autonomous merchant store with admitted agents only, maintain storefront uptime, and coordinate x402, MPP, AP2, pay.sh, and Solana Pay settlement. Register and verify the store against x402.wtf on every boot.",
  };
}

function printLaunchPlan(session: ReturnType<typeof buildSession>): void {
  console.log(`session: ${session.sessionId}`);
  console.log(`manifest: ${session.manifest}`);
  console.log("infrastructure:");
  for (const service of session.infrastructure) {
    console.log(`- ${service.id}: ${service.command}`);
  }
  console.log("fleet:");
  for (const worker of session.fleet) {
    console.log(`- ${worker.agentId} [${worker.lane}]: ${worker.command}`);
  }
}

function selectAgents(registry: Registry, agentIds: string[]): AgentRecord[] {
  if (agentIds.length === 0) {
    return registry.admission.allow.map((id) => requireAgent(registry, id));
  }
  return agentIds.map((id) => requireAgent(registry, id));
}

function cmdList(): number {
  const registry = loadJson<Registry>(REGISTRY_PATH);
  const catalog = loadJson<Catalog>(CATALOG_PATH);

  console.log(`${registry.store.name}`);
  console.log(`operator: ${registry.store.operator}`);
  console.log(`merchant: ${catalog.merchant.name} (${catalog.merchant.domain})`);
  console.log(`allowed agents: ${registry.admission.allow.join(", ")}`);
  console.log(`denied agents: ${registry.admission.deny.join(", ")}`);
  console.log(`protocols: ${catalog.protocols.join(", ")}`);
  console.log(`x402.wtf payments: ${registry.x402?.paymentGateway ?? X402_PAYMENTS_ENDPOINT}`);
  console.log(`x402.wtf registry: ${registry.x402?.registry ?? X402_REGISTRY_ENDPOINT}`);
  console.log("");
  console.log("featured offers:");
  for (const offer of catalog.featuredOffers) {
    console.log(`- ${offer.label} · ${offer.price} · ${offer.protocol}`);
  }
  console.log("");
  console.log("fleet lanes:");
  for (const agent of registry.agents) {
    const runtime = runtimeProfile(agent, "./generated/openclawd.agent-store.json");
    console.log(`- ${agent.id}: ${runtime.lane} · ${runtime.objective}`);
  }
  return 0;
}

function cmdManifest(agentIds: string[]): number {
  const registry = loadJson<Registry>(REGISTRY_PATH);
  const catalog = loadJson<Catalog>(CATALOG_PATH);
  const selected = selectAgents(registry, agentIds);
  const manifest = buildManifest(registry, selected, catalog);
  const outputDir = ensureOutputDir();
  const outputPath = join(outputDir, "openclawd.agent-store.json");
  writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
  console.log(outputPath);
  return 0;
}

function cmdJoin(agentIds: string[]): number {
  const registry = loadJson<Registry>(REGISTRY_PATH);
  const catalog = loadJson<Catalog>(CATALOG_PATH);
  const selected = selectAgents(registry, agentIds);
  const manifest = buildManifest(registry, selected, catalog);
  console.log(JSON.stringify(manifest, null, 2));
  return 0;
}

function cmdLaunch(agentIds: string[]): number {
  const registry = loadJson<Registry>(REGISTRY_PATH);
  const catalog = loadJson<Catalog>(CATALOG_PATH);
  const selected = selectAgents(registry, agentIds);
  const manifest = buildManifest(registry, selected, catalog);

  const outputDir = ensureOutputDir();
  const manifestPath = join(outputDir, "openclawd.agent-store.json");
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const sessionId = `store-${new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-")}`;
  const session = buildSession(registry, catalog, selected, manifestPath, sessionId);

  const sessionDir = ensureOutputDir("sessions");
  const sessionPath = join(sessionDir, `${sessionId}.json`);
  writeFileSync(sessionPath, JSON.stringify(session, null, 2));

  printLaunchPlan(session);
  console.log(`session_file: ${sessionPath}`);
  return 0;
}

function main(): number {
  const { positionals } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
  });

  const [command = "list", ...rest] = positionals;

  switch (command) {
    case "list":
      return cmdList();
    case "manifest":
      return cmdManifest(rest);
    case "join":
      return cmdJoin(rest);
    case "launch":
      return cmdLaunch(rest);
    default:
      console.error(`unknown command: ${command}`);
      return 1;
  }
}

process.exit(main());
