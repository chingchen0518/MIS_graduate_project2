// part2.jsx 評論
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import { TreemapChart as Treemap } from '../treemap_chyi.jsx';

/** 把 /api/comments 的資料轉成 Map<a_id, Array<{user_id, content, created_at}>> */
function normalizeComments(raw, tripId) {
  const map = new Map();

  // ① 扁平結構：[{ id, attraction_id, user_id, content, created_at }, ...]
  if (Array.isArray(raw) && raw.length && 'attraction_id' in raw[0]) {
    for (const c of raw) {
      const a = Number(c.attraction_id);
      if (!map.has(a)) map.set(a, []);
      map.get(a).push({
        user_id: c.user_id ?? '匿名',
        content: c.content ?? '',
        created_at: c.created_at ?? new Date().toISOString(),
      });
    }
    return map;
  }

  // ② 分 trip 的結構：[{ t_id, comments:[{ a_id, user_id:[], content:[], created_at:[] }, ...] }]
  const arr = Array.isArray(raw) ? raw : [];
  const blk = arr.find(x => Number(x.t_id) === Number(tripId)) || arr[0] || {};
  const rows = Array.isArray(blk.comments)
    ? blk.comments
    : Array.isArray(blk.re_attractions)
    ? blk.re_attractions
    : [];

  for (const r of rows) {
    const a = Number(r.a_id);
    const U = Array.isArray(r.user_id) ? r.user_id : (r.user_id != null ? [r.user_id] : []);
    const C = Array.isArray(r.content) ? r.content : (r.content != null ? [r.content] : []);
    const T = Array.isArray(r.created_at) ? r.created_at : (r.created_at != null ? [r.created_at] : []);
    const len = Math.max(U.length, C.length, T.length);
    const list = [];
    for (let i = 0; i < len; i++) {
      list.push({
        user_id: U[i] ?? '匿名',
        content: C[i] ?? '',
        created_at: T[i] ?? new Date().toISOString(),
      });
    }
    map.set(a, list);
  }
  return map;
}

/** 簡單留言彈窗 */
function CommentsModal({ open, title, list, onClose }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 520, maxWidth: '92vw', maxHeight: '80vh', overflow: 'auto',
          background: '#fff', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          padding: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>{title || '留言'}</h3>
          <button
            onClick={onClose}
            style={{ marginLeft: 'auto', border: '1px solid #ddd', background: '#fafafa', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}
          >關閉</button>
        </div>

        {(!list || list.length === 0) ? (
          <div style={{ opacity: 0.7 }}>目前沒有留言</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {list.map((c, i) => (
              <li key={i} style={{ padding: '10px 6px', borderBottom: '1px solid #eee' }}>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>
                  <strong>{c.user_id || '匿名'}</strong> ・ {new Date(c.created_at).toLocaleString()}
                </div>
                <div>{c.content}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function Part2({ tripId = 1 }) {
  const [tmData, setTmData] = useState([]);
  const [commentsMap, setCommentsMap] = useState(new Map());
  const [selectedAid, setSelectedAid] = useState(null);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  /** 抓 Treemap（含投票數） */
  const loadTreemapData = useCallback(async () => {
    const { data } = await axios.get('http://localhost:3001/api/d3', {
      params: { t_id: tripId },
    });
    const norm = (Array.isArray(data) ? data : []).map(d => ({
      t_id: Number(d.t_id ?? tripId),
      a_id: Number(d.a_id),
      name_zh: d.name_zh || d.name || '未命名',
      category: d.category || 'Unknown',
      photo: d.photo || '',
      vote_like: Number(d.vote_like ?? 0),
      vote_love: Number(d.vote_love ?? 0),
      total_votes:
        d.total_votes != null
          ? Number(d.total_votes)
          : Number(d.vote_like ?? 0) + Number(d.vote_love ?? 0),
    }));
    setTmData(norm);
  }, [tripId]);

  /** 抓留言（/api/comments） */
  const loadComments = useCallback(async () => {
    const { data } = await axios.get('http://localhost:3001/api/comments');
    setCommentsMap(normalizeComments(data, tripId));
  }, [tripId]);

  /** 初次載入：同時抓 treemap + comments */
  useEffect(() => {
    setLoading(true);
    setErr(null);
    Promise.all([loadTreemapData(), loadComments()])
      .catch(setErr)
      .finally(() => setLoading(false));
  }, [loadTreemapData, loadComments]);

  /** 給 Treemap 的 refresh：例如投票成功後會呼叫 */
  const handleRefresh = useCallback(() => {
    return Promise.all([loadTreemapData(), loadComments()]).catch(console.error);
  }, [loadTreemapData, loadComments]);

  const shownComments = useMemo(() => {
    if (!selectedAid) return [];
    return commentsMap.get(selectedAid) ?? [];
  }, [commentsMap, selectedAid]);

  if (loading) return <div style={{ padding: 16, opacity: 0.7 }}>載入中…</div>;
  if (err) return <div style={{ padding: 16, color: 'crimson' }}>讀取失敗：{String(err?.message || err)}</div>;

  return (
    <div style={{ padding: 16 }}>
      <Treemap
        data={tmData}
        width={900}
        height={520}
        onRefresh={handleRefresh}
        onSelect={(d) => {
          // 需要 treemap_chyi.jsx 有把 onSelect 綁在每個 tile 的 click
          setSelectedAid(d?.a_id ?? null);
          setSelectedTitle(d?.name_zh || d?.name || `景點 #${d?.a_id ?? ''}`);
        }}
      />
      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
        提示：點 treemap 的方塊可查看該景點的留言
      </div>

      <CommentsModal
        open={!!selectedAid}
        title={selectedTitle}
        list={shownComments}
        onClose={() => setSelectedAid(null)}
      />
    </div>
  );
}
