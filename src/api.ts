// src/api.ts
export const BASE = import.meta.env.DEV ? '/api' : '';

function urlOf(input: RequestInfo | URL) {
  return typeof input === 'string' ? input : (input as URL).toString?.() ?? '[object Request]';
}

async function getJson(input: RequestInfo | URL, init: RequestInit = {}) {
  const res = await fetch(input, init);
  const ct = res.headers.get('content-type') || '';
  const text = await res.text();
  if (ct.includes('application/json')) {
    try { return JSON.parse(text); }
    catch (e) { throw new Error(`JSON parse failed for ${urlOf(input)}: ${String(e)}`); }
  }
  throw new Error(`Expected JSON from ${urlOf(input)}, got ${res.status} ${ct}: ${text.slice(0,200)}`);
}

function asArray(v: any): any[] {
  if (Array.isArray(v)) return v;
  if (v && Array.isArray(v.items)) return v.items;
  if (v && Array.isArray(v.data))  return v.data;
  return [];
}
function asObj(v: any): Record<string, any> {
  return v && typeof v === 'object' ? v : {};
}

// IMMER Cookies mitschicken + Accept Header
function adminFetch(url: string, init: RequestInit = {}) {
  const merged: RequestInit = {
    credentials: 'include',
    headers: { Accept: 'application/json', ...(init.headers || {}) },
    ...init,
  };
  return getJson(url, merged);
}

function jsonHeaders(): Record<string,string> {
  return { 'Content-Type': 'application/json', 'Accept': 'application/json' };
}

function adminHeaders(): Record<string,string> {
  const h = jsonHeaders();
  const token =
    localStorage.getItem('adminToken') ||
    (import.meta.env.VITE_ADMIN_TOKEN as string | undefined) || '';
  if (token) h['X-Admin-Token'] = token;
  return h;
}

/* -------- AUTH -------- */
export function authMe() {
  return getJson(`${BASE}/auth/me`, { credentials: 'include' });
}

export function authLogin(email: string, password: string) {
  return getJson(`${BASE}/auth/login`, {
    method: 'POST',
    headers: jsonHeaders(),
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
}

export function authLogout() {
  return getJson(`${BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export function selectRestaurant(restaurant_id: number) {
  return getJson(`${BASE}/auth/select-restaurant`, {
    method: 'POST',
    headers: jsonHeaders(),
    credentials: 'include',
    body: JSON.stringify({ restaurant_id }),
  });
}

/* -------- CUSTOMER -------- */
export function fetchCustomerMenu(slug: string) {
  return getJson(`${BASE}/c/${encodeURIComponent(slug)}/api/menu`,
    { headers: { Accept: 'application/json' } });
}

export function submitOrder(slug: string, payload: any) {
  return getJson(`${BASE}/c/${encodeURIComponent(slug)}/api/orders`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

/* -------- ADMIN: Orders -------- */
export async function fetchAdminOrders(slug: string) {
  const j = await getJson(`${BASE}/a/${encodeURIComponent(slug)}/api/orders`, {
    credentials: 'include',
    headers: { Accept: 'application/json', ...tokenHeaderMaybe() },
  });
  const rows = asArray(j?.data);
  return { ok: j?.ok !== false, data: rows };
}

export function updateOrderStatus(slug: string, order_id: number, status: string) {
  return adminFetch(`${BASE}/a/${encodeURIComponent(slug)}/api/orders/status`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ order_id, status }),
  });
}

export function updatePaymentStatus(slug: string, order_id: number, payment_status: string, payment_method?: string) {
  return adminFetch(`${BASE}/a/${encodeURIComponent(slug)}/api/orders/payment`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ order_id, payment_status, payment_method }),
  });
}

/* -------- ADMIN: Menu -------- */
export async function fetchAdminMenu(slug: string) {
  const j = await getJson(`${BASE}/a/${encodeURIComponent(slug)}/api/menu`, {
    credentials: 'include',
    headers: { Accept: 'application/json', ...tokenHeaderMaybe() },
  });
  const dataObj = asObj(j?.data);
  const items   = asArray(dataObj?.items);
  return { ok: j?.ok !== false, data: { items } };
}

export function addMenuItem(slug: string, body: any) {
  return adminFetch(`${BASE}/a/${encodeURIComponent(slug)}/api/menu/add`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(body),
  });
}

export function updateMenuItem(slug: string, body: any) {
  return adminFetch(`${BASE}/a/${encodeURIComponent(slug)}/api/menu/update`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(body),
  });
}

export function deleteMenuItem(slug: string, id: number) {
  return adminFetch(`${BASE}/a/${encodeURIComponent(slug)}/api/menu/delete`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ id }),
  });
}

export function toggleItem(slug: string, id: number) {
  return adminFetch(`${BASE}/a/${encodeURIComponent(slug)}/api/menu/toggle`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ id }),
  });
}

/* -------- ADMIN: Tables -------- */
export type TableRow = { id:number; table_number:string|number; table_token?:string|null };
type TableLike = Record<string, unknown>;

export async function fetchTables(
  slug: string
): Promise<{ ok: boolean; data: TableRow[] }> {
  console.log("🔍 Fetching tables for slug:", slug);

  try {
    const raw = await getJson(`${BASE}/a/${encodeURIComponent(slug)}/api/tables`, {
      credentials: "include",
      headers: { Accept: "application/json", ...tokenHeaderMaybe() },
    });
    console.log("📡 Raw backend response:", raw);

    // -> locker casten, damit TS nicht nörgelt
    const r: any = raw;

    // Kandidaten-Arrays in Priorität
    const candidates = [r?.data, r?.data?.data, r?.items, r];

    let tablesArray: TableLike[] = [];
    for (const c of candidates) {
      if (Array.isArray(c)) {
        tablesArray = c as TableLike[];
        break;
      }
    }

    console.log("📋 Using tables array with length:", tablesArray.length);
    if (tablesArray[0]) {
      console.log("🔍 First element keys:", Object.keys(tablesArray[0] as object));
    }

    // Typisierte Map-Callback-Parameter -> kein "implicit any"
    const normalizedData: TableRow[] = tablesArray
      .map((item: TableLike, index: number) => {
        const mapped = mapTableRow(item);
        console.log(`✅ Mapped[${index}]:`, mapped);
        return mapped;
      })
      .filter((x): x is TableRow => Boolean(x));

    const ok = typeof r?.ok === "boolean" ? (r.ok as boolean) : true;
    return { ok, data: normalizedData };
  } catch (error) {
    console.error("❌ Error fetching tables:", error);
    return { ok: false, data: [] };
  }
}

export async function getCurrentTotal(slug: string, table_number: string | number) {
  const raw = await getJson(
    `${BASE}/a/${encodeURIComponent(slug)}/api/tables/current-total?table_number=${encodeURIComponent(String(table_number))}`,
    { credentials: 'include', headers: { Accept: 'application/json', ...tokenHeaderMaybe() } }
  );
  if (raw?.data && typeof raw.data.total === 'number') return raw;
  const total = typeof raw?.total === 'number' ? raw.total : 0;
  return { ok: true, data: { total } };
}

export async function createTable(slug: string, table_number: string | number) {
  return getJson(`${BASE}/a/${encodeURIComponent(slug)}/api/tables/create`, {
    method: 'POST',
    credentials: 'include',
    headers: { ...jsonHeaders(), ...tokenHeaderMaybe() },
    body: JSON.stringify({ table_number: String(table_number) }),
  });
}

export async function updateTable(slug: string, id: number, table_number: string | number) {
  return getJson(`${BASE}/a/${encodeURIComponent(slug)}/api/tables/update`, {
    method: 'POST',
    credentials: 'include',
    headers: { ...jsonHeaders(), ...tokenHeaderMaybe() },
    body: JSON.stringify({ id, table_number: String(table_number) }),
  });
}

export async function deleteTable(slug: string, id: number) {
  return getJson(`${BASE}/a/${encodeURIComponent(slug)}/api/tables/delete`, {
    method: 'POST',
    credentials: 'include',
    headers: { ...jsonHeaders(), ...tokenHeaderMaybe() },
    body: JSON.stringify({ id }),
  });
}

export async function freeTable(slug: string, table_number: string | number) {
  return getJson(`${BASE}/a/${encodeURIComponent(slug)}/api/tables/free`, {
    method: 'POST',
    credentials: 'include',
    headers: { ...jsonHeaders(), ...tokenHeaderMaybe() },
    body: JSON.stringify({ table_number: String(table_number) }),
  });
}

function tokenHeaderMaybe(): Record<string, string> {
  const token =
    localStorage.getItem('adminToken') ||
    (import.meta.env.VITE_ADMIN_TOKEN as string | undefined) ||
    '';
  return token ? { 'X-Admin-Token': token } : {};
}

function mapTableRow(x: any): TableRow | null {
  if (!x || typeof x !== 'object') return null;

  const id =
    Number(x.id ?? x.table_id ?? x.tid ?? NaN);

  const table_number =
    x.table_number ??
    x.number ??
    x.tableNo ??
    x.table ??
    x.nr ??
    x.name ?? // notfalls
    null;

  const table_token =
    x.table_token ??
    x.token ??
    x.qr_token ??
    x.qr ??
    null;

  if (!Number.isFinite(id) || table_number == null) return null;
  return { id, table_number, table_token };
}

/* -------- QR Helper -------- */
export function buildCustomerUrl(slug: string, table_token: string) {
  const base =
    (import.meta.env.VITE_CLIENT_BASE as string | undefined) ||
    (import.meta.env.VITE_API_BASE as string | undefined) ||
    window.location.origin;
  return `${base.replace(/\/$/, '')}/c/${encodeURIComponent(slug)}?t=${encodeURIComponent(table_token)}`;
}
