// サンプルデータ生成
import { v4 as uuidv4 } from "uuid";

export interface RawLog {
  id: string;
  sourceId: string;
  timestamp: Date;
  raw: string;
  parsed: Record<string, unknown>;
  level: "info" | "warn" | "error" | "debug" | null;
}

// ランダム要素選択
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ランダム整数生成
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ランダムIP生成
function randomIP(): string {
  return `${randInt(1, 255)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`;
}

// ランダム日時生成（過去30日以内）
function randomDate(): Date {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  return new Date(randInt(thirtyDaysAgo, now));
}

// Webサーバーログ生成
export function generateWebLogs(count: number, sourceId: string): RawLog[] {
  const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
  const paths = [
    "/", "/api/users", "/api/products", "/api/orders", "/api/auth/login",
    "/api/auth/logout", "/api/cart", "/api/search", "/static/js/main.js",
    "/static/css/style.css", "/images/logo.png", "/health", "/api/v1/items",
    "/api/v1/categories", "/dashboard", "/admin/users", "/api/payments"
  ];
  const statuses = [200, 200, 200, 200, 201, 204, 301, 302, 400, 401, 403, 404, 500, 502, 503];
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
    "curl/7.68.0",
    "PostmanRuntime/7.28.0"
  ];

  const logs: RawLog[] = [];
  for (let i = 0; i < count; i++) {
    const timestamp = randomDate();
    const ip = randomIP();
    const method = pick(methods);
    const path = pick(paths);
    const status = pick(statuses);
    const bytes = randInt(100, 50000);
    const responseTime = randInt(1, 5000);
    const userAgent = pick(userAgents);

    const dateStr = timestamp.toISOString().replace("T", " ").substring(0, 19);
    const raw = `${ip} - - [${dateStr}] "${method} ${path} HTTP/1.1" ${status} ${bytes} "-" "${userAgent}" ${responseTime}ms`;

    let level: RawLog["level"] = "info";
    if (status >= 500) level = "error";
    else if (status >= 400) level = "warn";

    logs.push({
      id: uuidv4(),
      sourceId,
      timestamp,
      raw,
      parsed: {
        client_ip: ip,
        method,
        path,
        status,
        bytes,
        response_time: responseTime,
        user_agent: userAgent,
        host: "webserver-01"
      },
      level
    });
  }

  return logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

// ECサイトアプリケーションログ生成
export function generateAppLogs(count: number, sourceId: string): RawLog[] {
  const actions = [
    "user_login", "user_logout", "user_register", "product_view", "product_search",
    "cart_add", "cart_remove", "cart_update", "order_create", "order_complete",
    "payment_start", "payment_success", "payment_failed", "review_submit",
    "wishlist_add", "coupon_apply", "address_update", "profile_update"
  ];
  const users = ["user_001", "user_002", "user_003", "user_004", "user_005",
                 "user_006", "user_007", "user_008", "user_009", "user_010"];
  const products = ["PROD-001", "PROD-002", "PROD-003", "PROD-004", "PROD-005",
                    "PROD-006", "PROD-007", "PROD-008", "PROD-009", "PROD-010"];
  const categories = ["electronics", "clothing", "books", "home", "sports"];

  const logs: RawLog[] = [];
  for (let i = 0; i < count; i++) {
    const timestamp = randomDate();
    const action = pick(actions);
    const userId = pick(users);
    const productId = pick(products);
    const category = pick(categories);
    const sessionId = `sess_${uuidv4().substring(0, 8)}`;
    const amount = randInt(100, 50000);

    let level: RawLog["level"] = "info";
    let message = "";

    switch (action) {
      case "payment_failed":
        level = "error";
        message = `Payment failed for order. Amount: ${amount}`;
        break;
      case "user_login":
        message = `User logged in successfully`;
        break;
      case "order_create":
        message = `New order created. Amount: ${amount}`;
        break;
      case "product_view":
        message = `Product viewed: ${productId} in category ${category}`;
        break;
      default:
        message = `Action ${action} completed`;
    }

    const parsed = {
      action,
      user_id: userId,
      product_id: productId,
      category,
      session_id: sessionId,
      amount,
      message,
      service: "ec-app"
    };

    const raw = JSON.stringify({
      timestamp: timestamp.toISOString(),
      level: level.toUpperCase(),
      ...parsed
    });

    logs.push({
      id: uuidv4(),
      sourceId,
      timestamp,
      raw,
      parsed,
      level
    });
  }

  return logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

// セキュリティログ生成
export function generateSecurityLogs(count: number, sourceId: string): RawLog[] {
  const events = [
    { type: "LOGIN_SUCCESS", level: "info" as const },
    { type: "LOGIN_FAILED", level: "warn" as const },
    { type: "LOGOUT", level: "info" as const },
    { type: "PASSWORD_CHANGE", level: "info" as const },
    { type: "PERMISSION_DENIED", level: "warn" as const },
    { type: "SUSPICIOUS_ACTIVITY", level: "error" as const },
    { type: "BRUTE_FORCE_DETECTED", level: "error" as const },
    { type: "SESSION_EXPIRED", level: "info" as const },
    { type: "API_KEY_INVALID", level: "warn" as const },
    { type: "RATE_LIMIT_EXCEEDED", level: "warn" as const }
  ];
  const users = ["admin", "operator", "user1", "user2", "user3", "guest", "service_account"];
  const sources = ["web", "api", "mobile", "admin_panel", "cli"];

  const logs: RawLog[] = [];
  for (let i = 0; i < count; i++) {
    const timestamp = randomDate();
    const event = pick(events);
    const user = pick(users);
    const source = pick(sources);
    const ip = randomIP();
    const requestId = `req_${uuidv4().substring(0, 12)}`;

    const facility = "auth";
    const priority = event.level === "error" ? 3 : event.level === "warn" ? 4 : 6;
    const hostname = "security-server";

    const raw = `<${priority}>${timestamp.toISOString()} ${hostname} ${facility}: [${event.type}] user=${user} source=${source} ip=${ip} request_id=${requestId}`;

    logs.push({
      id: uuidv4(),
      sourceId,
      timestamp,
      raw,
      parsed: {
        event_type: event.type,
        user,
        source,
        client_ip: ip,
        request_id: requestId,
        facility,
        hostname
      },
      level: event.level
    });
  }

  return logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

// GCログ生成
export function generateGCLogs(count: number, sourceId: string): RawLog[] {
  const gcTypes = ["G1 Young Generation", "G1 Old Generation", "G1 Full GC"];

  const logs: RawLog[] = [];
  for (let i = 0; i < count; i++) {
    const timestamp = randomDate();
    const gcType = pick(gcTypes);
    const heapBefore = randInt(500, 4000);
    const heapAfter = randInt(100, heapBefore);
    const heapTotal = 4096;
    const pauseTime = gcType === "G1 Full GC" ? randInt(100, 2000) : randInt(5, 100);
    const cpuTime = pauseTime * (0.8 + Math.random() * 0.4);

    const level: RawLog["level"] = gcType === "G1 Full GC" ? "warn" : pauseTime > 50 ? "warn" : "info";

    const raw = `[${timestamp.toISOString()}][GC] ${gcType}: ${heapBefore}M->${heapAfter}M(${heapTotal}M), ${pauseTime.toFixed(1)}ms, CPU: ${cpuTime.toFixed(1)}ms`;

    logs.push({
      id: uuidv4(),
      sourceId,
      timestamp,
      raw,
      parsed: {
        gc_type: gcType,
        heap_before_mb: heapBefore,
        heap_after_mb: heapAfter,
        heap_total_mb: heapTotal,
        pause_time_ms: pauseTime,
        cpu_time_ms: cpuTime,
        freed_mb: heapBefore - heapAfter
      },
      level
    });
  }

  return logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

// Kubernetesログ生成
export function generateK8sLogs(count: number, sourceId: string): RawLog[] {
  const namespaces = ["default", "kube-system", "production", "staging", "monitoring"];
  const pods = ["api-server", "web-frontend", "worker", "scheduler", "redis", "postgres"];
  const containers = ["main", "sidecar", "init"];
  const events = [
    { msg: "Started container", level: "info" as const },
    { msg: "Pulling image", level: "info" as const },
    { msg: "Successfully pulled image", level: "info" as const },
    { msg: "Container started", level: "info" as const },
    { msg: "Readiness probe succeeded", level: "info" as const },
    { msg: "Liveness probe failed", level: "error" as const },
    { msg: "OOMKilled", level: "error" as const },
    { msg: "CrashLoopBackOff", level: "error" as const },
    { msg: "Back-off restarting failed container", level: "warn" as const },
    { msg: "Successfully assigned pod to node", level: "info" as const }
  ];
  const nodes = ["node-01", "node-02", "node-03"];

  const logs: RawLog[] = [];
  for (let i = 0; i < count; i++) {
    const timestamp = randomDate();
    const namespace = pick(namespaces);
    const podBase = pick(pods);
    const podName = `${podBase}-${uuidv4().substring(0, 5)}`;
    const container = pick(containers);
    const event = pick(events);
    const node = pick(nodes);

    const raw = `${timestamp.toISOString()} ${event.level.toUpperCase()} [${namespace}/${podName}] ${container}: ${event.msg}`;

    logs.push({
      id: uuidv4(),
      sourceId,
      timestamp,
      raw,
      parsed: {
        namespace,
        pod: podName,
        pod_base: podBase,
        container,
        message: event.msg,
        node,
        cluster: "main-cluster"
      },
      level: event.level
    });
  }

  return logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

// データベースログ生成
export function generateDBLogs(count: number, sourceId: string): RawLog[] {
  const queries = [
    "SELECT * FROM users WHERE id = ?",
    "SELECT * FROM products WHERE category = ? ORDER BY created_at DESC LIMIT 100",
    "SELECT * FROM orders WHERE user_id = ? AND status = ?",
    "UPDATE products SET stock = stock - 1 WHERE id = ?",
    "INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)",
    "SELECT COUNT(*) FROM logs WHERE created_at > ?",
    "DELETE FROM sessions WHERE expires_at < NOW()",
    "SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id"
  ];
  const databases = ["ec_production", "ec_analytics", "user_db"];
  const users = ["app_user", "readonly_user", "admin"];

  const logs: RawLog[] = [];
  for (let i = 0; i < count; i++) {
    const timestamp = randomDate();
    const query = pick(queries);
    const database = pick(databases);
    const user = pick(users);
    const queryTime = Math.random() < 0.1 ? randInt(1000, 30000) : randInt(1, 1000);
    const rowsExamined = randInt(1, 100000);
    const rowsSent = randInt(0, 1000);

    const level: RawLog["level"] = queryTime > 5000 ? "error" : queryTime > 1000 ? "warn" : "info";

    const raw = `# Time: ${timestamp.toISOString()}
# User@Host: ${user}[${user}] @ localhost []  Id: ${randInt(1000, 9999)}
# Query_time: ${(queryTime / 1000).toFixed(6)}  Lock_time: ${(Math.random() * 0.01).toFixed(6)} Rows_sent: ${rowsSent}  Rows_examined: ${rowsExamined}
SET timestamp=${Math.floor(timestamp.getTime() / 1000)};
${query}`;

    logs.push({
      id: uuidv4(),
      sourceId,
      timestamp,
      raw,
      parsed: {
        query,
        database,
        user,
        query_time_ms: queryTime,
        rows_examined: rowsExamined,
        rows_sent: rowsSent,
        is_slow: queryTime > 1000
      },
      level
    });
  }

  return logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

// ネットワーク/Firewallログ生成
export function generateNetworkLogs(count: number, sourceId: string): RawLog[] {
  const actions = ["ACCEPT", "ACCEPT", "ACCEPT", "DENY", "DROP"];
  const protocols = ["TCP", "UDP", "ICMP", "HTTP", "HTTPS"];
  const ports = [22, 80, 443, 3306, 5432, 6379, 8080, 8443, 27017];
  const interfaces = ["eth0", "eth1", "wlan0"];
  const directions = ["IN", "OUT", "FWD"];

  const logs: RawLog[] = [];
  for (let i = 0; i < count; i++) {
    const timestamp = randomDate();
    const action = pick(actions);
    const protocol = pick(protocols);
    const srcIP = randomIP();
    const dstIP = randomIP();
    const srcPort = randInt(1024, 65535);
    const dstPort = pick(ports);
    const bytes = randInt(64, 65535);
    const packets = randInt(1, 1000);
    const iface = pick(interfaces);
    const direction = pick(directions);

    let level: RawLog["level"] = "info";
    if (action === "DENY" || action === "DROP") level = "warn";

    const raw = `${timestamp.toISOString()} kernel: [FIREWALL] ${action} ${direction} ${iface} SRC=${srcIP} DST=${dstIP} PROTO=${protocol} SPT=${srcPort} DPT=${dstPort} LEN=${bytes} PACKETS=${packets}`;

    logs.push({
      id: uuidv4(),
      sourceId,
      timestamp,
      raw,
      parsed: {
        action,
        protocol,
        src_ip: srcIP,
        dst_ip: dstIP,
        src_port: srcPort,
        dst_port: dstPort,
        bytes,
        packets,
        interface: iface,
        direction,
        firewall: "fw-01"
      },
      level
    });
  }

  return logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

// システムメトリクスログ生成
export function generateSystemLogs(count: number, sourceId: string): RawLog[] {
  const hosts = ["server-01", "server-02", "server-03", "server-04"];
  const metrics = [
    { name: "cpu_usage", unit: "%", min: 0, max: 100, warn: 80, error: 95 },
    { name: "memory_usage", unit: "%", min: 30, max: 100, warn: 85, error: 95 },
    { name: "disk_usage", unit: "%", min: 40, max: 100, warn: 80, error: 90 },
    { name: "load_average", unit: "", min: 0, max: 8, warn: 4, error: 6 },
    { name: "network_rx_mbps", unit: "Mbps", min: 0, max: 1000, warn: 800, error: 950 },
    { name: "network_tx_mbps", unit: "Mbps", min: 0, max: 1000, warn: 800, error: 950 }
  ];

  const logs: RawLog[] = [];
  for (let i = 0; i < count; i++) {
    const timestamp = randomDate();
    const host = pick(hosts);
    const metric = pick(metrics);
    const value = metric.min + Math.random() * (metric.max - metric.min);

    let level: RawLog["level"] = "info";
    if (value >= metric.error) level = "error";
    else if (value >= metric.warn) level = "warn";

    const raw = `${timestamp.toISOString()} ${host} system-monitor[${randInt(1000, 9999)}]: ${metric.name}=${value.toFixed(2)}${metric.unit}`;

    logs.push({
      id: uuidv4(),
      sourceId,
      timestamp,
      raw,
      parsed: {
        hostname: host,
        metric_name: metric.name,
        value: parseFloat(value.toFixed(2)),
        unit: metric.unit,
        threshold_warn: metric.warn,
        threshold_error: metric.error,
        service: "system-monitor"
      },
      level
    });
  }

  return logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

// 全サンプルデータ生成
export function generateAllSampleData(): {
  sources: Array<{ id: string; name: string; type: string; format: string }>;
  logs: RawLog[];
} {
  const sources = [
    { id: "src_web", name: "Webサーバーログ", type: "web", format: "apache" },
    { id: "src_app", name: "ECサイトアプリログ", type: "app", format: "json" },
    { id: "src_security", name: "セキュリティログ", type: "security", format: "syslog" },
    { id: "src_gc", name: "JVM GCログ", type: "gc", format: "gc" },
    { id: "src_k8s", name: "Kubernetesログ", type: "k8s", format: "k8s" },
    { id: "src_db", name: "データベースログ", type: "db", format: "mysql_slow" },
    { id: "src_network", name: "ネットワーク/Firewallログ", type: "network", format: "firewall" },
    { id: "src_system", name: "システムメトリクスログ", type: "system", format: "metrics" }
  ];

  const logs: RawLog[] = [
    ...generateWebLogs(1000, "src_web"),
    ...generateAppLogs(1000, "src_app"),
    ...generateSecurityLogs(1000, "src_security"),
    ...generateGCLogs(1000, "src_gc"),
    ...generateK8sLogs(1000, "src_k8s"),
    ...generateDBLogs(1000, "src_db"),
    ...generateNetworkLogs(1000, "src_network"),
    ...generateSystemLogs(1000, "src_system")
  ];

  // 全ログを時系列順にソート
  return { sources, logs: logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()) };
}
