// A tiny stand-in for Supabase's PostgREST API, so the app can be driven (and
// photographed) without a real project, without touching real data, and with the same
// sample workouts every time. It only implements what the app actually asks for.
import { createServer } from 'node:http';

const PORT = Number(process.env.MOCK_SUPABASE_PORT ?? 54399);

const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

// Sessions: [n, date, createdAt, warmup, wod format, wod result, strength[], wod[]]
const SESSIONS = [
  [1, '2026-10-23', '2026-10-23T20:11:00Z', '500 m de remo, movilidad de cadera', 'For Time', '6:42',
    [['Back Squat', 100, 'kg', 5, 5, null]],
    [['Thruster', 43, 'kg', null, 3, [21, 15, 9]], ['Pull-ups', null, null, null, 3, [21, 15, 9]]]],
  [2, '2026-10-21', '2026-10-21T19:40:00Z', '3 rondas: 10 air squats, 10 push-ups', 'AMRAP 12', '5 rondas + 3 reps',
    [['Strict Press', 35, 'kg', 5, 3, null]],
    [['Wall balls', 9, 'kg', 15, null, null], ['Box jumps', null, null, 12, null, null]]],
  [3, '2026-10-19', '2026-10-19T20:05:00Z', 'Remo suave y activación de hombros', '10-8-6-4-2', '9:15',
    [['Deadlift', 120, 'kg', 3, 5, null]],
    [['Kettlebell swings', 24, 'kg', null, 5, [10, 8, 6, 4, 2]]]],
  [4, '2026-10-16', '2026-10-16T19:30:00Z', '', 'EMOM 10', '',
    [['Power Clean', 60, 'kg', 2, 6, null]],
    [['Burpees', null, null, 8, null, null]]],
];

const sessions = [];
const blocks = [];
const exercises = [];
let blockN = 100;
let exerciseN = 1000;

for (const [n, date, createdAt, warmup, format, result, strength, wod] of SESSIONS) {
  sessions.push({ id: id(n), session_date: date, whiteboard_photo_url: null, notes: null, created_at: createdAt });
  const mk = (type, extra = {}) => {
    const b = { id: id(++blockN), session_id: id(n), block_type: type, wod_format: null, result: null, notes: null, created_at: createdAt, ...extra };
    blocks.push(b);
    return b;
  };
  mk('warmup', { notes: warmup || null });
  const s = mk('strength_skill');
  const w = mk('wod', { wod_format: format || null, result: result || null });
  const add = (block, [name, weight, unit, reps, sets, scheme]) =>
    exercises.push({ id: id(++exerciseN), block_id: block.id, exercise_name: name, weight, unit, reps, sets, rep_scheme: scheme, created_at: createdAt });
  strength.forEach(e => add(s, e));
  wod.forEach(e => add(w, e));
}

const TABLES = { sessions, blocks, exercises, login_attempts: [] };

function applyFilters(rows, params) {
  return rows.filter(row =>
    [...params].every(([key, value]) => {
      if (!(key in row)) return true; // select, order, offset, limit, ...
      const [op, ...rest] = value.split('.');
      const arg = rest.join('.');
      if (op === 'eq') return String(row[key]) === arg;
      if (op === 'in') return arg.replace(/^\(|\)$/g, '').split(',').includes(String(row[key]));
      if (op === 'gte') return String(row[key]) >= arg;
      if (op === 'lte') return String(row[key]) <= arg;
      return true;
    })
  );
}

function applyOrder(rows, params) {
  // supabase-js joins several .order() calls into one comma-separated parameter.
  const orders = params.getAll('order').flatMap(o => o.split(',')).map(o => o.split('.'));
  return [...rows].sort((a, b) => {
    for (const [col, dir] of orders) {
      if (a[col] === b[col]) continue;
      return (a[col] > b[col] ? 1 : -1) * (dir === 'desc' ? -1 : 1);
    }
    return 0;
  });
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  const send = (status, body, headers = {}) => {
    res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
    res.end(body === undefined ? undefined : JSON.stringify(body));
  };

  const rpc = url.pathname.match(/^\/rest\/v1\/rpc\/(.+)$/);
  if (rpc) {
    // create_session returns the new session id
    req.resume();
    return req.on('end', () => send(200, id(900)));
  }

  const table = url.pathname.match(/^\/rest\/v1\/([a-z_]+)$/)?.[1];
  if (!table || !(table in TABLES)) return send(404, { message: `mock: no route for ${req.method} ${url.pathname}` });

  if (req.method === 'POST') {
    req.resume();
    return req.on('end', () => send(201));
  }
  if (req.method === 'DELETE') return send(204);

  const filtered = applyFilters(TABLES[table], url.searchParams);
  const total = filtered.length;
  const ordered = applyOrder(filtered, url.searchParams);
  const offset = Number(url.searchParams.get('offset') ?? 0);
  const limit = url.searchParams.has('limit') ? Number(url.searchParams.get('limit')) : undefined;
  const page = ordered.slice(offset, limit === undefined ? undefined : offset + limit);

  const range = { 'Content-Range': total === 0 ? '*/0' : `${offset}-${offset + Math.max(page.length - 1, 0)}/${total}` };

  if (req.method === 'HEAD') return send(200, undefined, range);

  // .single() asks for one object and expects an error when there isn't exactly one.
  if (String(req.headers.accept ?? '').includes('application/vnd.pgrst.object+json')) {
    return page.length === 1
      ? send(200, page[0], range)
      : send(406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' });
  }
  return send(200, page, range);
}).listen(PORT, '127.0.0.1', () => console.log(`mock supabase on :${PORT}`));
