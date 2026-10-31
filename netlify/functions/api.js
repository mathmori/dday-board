import { getStore } from '@netlify/blobs';

const STORE_NAME = 'dday-board';
const KEY = 'state';

export default async (req, context) => {
  const store = getStore(STORE_NAME);

  // 읽기
  if (req.method === 'GET') {
    let data = await store.get(KEY, { type: 'json' });
    if (!data) {
      data = { 
        title: '시험 D-DAY', 
        subtitle: '', 
        exams: [], 
        musicVideoId: 'uNEW_CzhpEc',
        songRequests: [],
        ddayRequests: []
      };
      await store.setJSON(KEY, data);
    }
    // 예전 데이터에 신청 목록이 없으면 빈 배열로 초기화
    if (!data.songRequests) data.songRequests = [];
    if (!data.ddayRequests) data.ddayRequests = [];
    
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 쓰기
  if (req.method === 'POST') {
    const body = await req.json();
    const pw = req.headers.get('x-admin-password');
    const isAdmin = process.env.ADMIN_PASSWORD && pw === process.env.ADMIN_PASSWORD;

    // 1) 관리자의 전체 저장 (비밀번호 필요)
    if (body.action === 'save') {
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: '비밀번호가 틀렸어요' }), {
          status: 401, headers: { 'Content-Type': 'application/json' }
        });
      }
      await store.setJSON(KEY, body.data);
      return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    // 2) 학생들의 신청 (비밀번호 불필요)
    if (body.action === 'request-song' || body.action === 'request-dday') {
      let data = await store.get(KEY, { type: 'json' });
      if (!data) return new Response('Error', { status: 500 });
      if (!data.songRequests) data.songRequests = [];
      if (!data.ddayRequests) data.ddayRequests = [];

      if (body.action === 'request-song') {
        data.songRequests.push({ 
          id: Date.now().toString(), 
          url: body.payload.url, 
          videoId: body.payload.videoId 
        });
      } else if (body.action === 'request-dday') {
        data.ddayRequests.push({ 
          id: Date.now().toString(), 
          ...body.payload 
        });
      }

      await store.setJSON(KEY, data);
      return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response('Bad Request', { status: 400 });
  }

  return new Response('Method Not Allowed', { status: 405 });
};
