import { getStore } from '@netlify/blobs';

const STORE_NAME = 'dday-board';
const KEY = 'state';

export default async (req) => {
  const store = getStore(STORE_NAME);

  // 읽기 — 누구나
  if (req.method === 'GET') {
    let data = await store.get(KEY, { type: 'json' });
    if (!data) {
      data = { title: '시험 D-DAY', subtitle: '', exams: [] };
      await store.setJSON(KEY, data);
    }
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 쓰기 — 비밀번호 필요
  if (req.method === 'POST') {
    const pw = req.headers.get('x-admin-password');
    if (!process.env.ADMIN_PASSWORD || pw !== process.env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: '비밀번호가 틀렸어요' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const body = await req.json();
    if (body.action === 'save') {
      await store.setJSON(KEY, body.data);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response('Bad Request', { status: 400 });
  }

  return new Response('Method Not Allowed', { status: 405 });
};