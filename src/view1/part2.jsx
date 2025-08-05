// part2.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

import './part2.css';
import Treemap from './treemap.jsx';

/* hooks */
import { useSlider }  from './slider';     // ./slider.js
import { useResizer } from './resize01';   // ./resize01.js

// 後端資料用的是英文國名，這裡做對照
const COUNTRY_MAP = { '瑞士': 'Switzerland', '日本': 'Japan', '台灣': 'Taiwan' };

/* ───────────────── Segmented Switch（景點投票人數 / 偏好程度） ───────────────── */
function SegSwitch({ value, onChange }) {
  const isRight = value === 'pref';
  const ref = useRef(null);

  const toggle   = () => onChange(isRight ? 'votes' : 'pref');
  const setLeft  = () => onChange('votes');
  const setRight = () => onChange('pref');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onKey = (e) => {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); setLeft(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setRight(); }
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="seg-switch" ref={ref} role="tablist" aria-label="排序切換" tabIndex={0}>
      <span className={`seg ${!isRight ? 'active' : ''}`} role="tab" aria-selected={!isRight} onClick={setLeft}>
        景點投票人數
      </span>
      <span className={`seg ${isRight ? 'active' : ''}`} role="tab" aria-selected={isRight} onClick={setRight}>
        偏好程度
      </span>
      <span className={`seg-indicator ${isRight ? 'right' : 'left'}`} aria-hidden="true" />
      <button className="seg-hit" aria-label="切換排序" onClick={toggle} />
    </div>
  );
}

export default function Part2({ tripId, country }) {
  const [d3Data, setD3Data] = useState([]);              // Treemap 資料（依 picked 合併票數）
  const [selectedItems, setSelectedItems] = useState([]); // Sidebar 顯示（由 treemap 點擊決定，最多 3 個）
  const [activeUserId, setActiveUserId] = useState(null);

  // 在 function Part2({ tripId, country }) 裡面：
  const [fullD3Data, setFullD3Data] = useState([]);


  const [commentsMap, setCommentsMap] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [commentModalOpen, setCommentModalOpen] = useState(false);

  const fetchCtrl = useRef(null);
  const [collapsed, setCollapsed] = useState(false);

  /* ───────── Layout constants ───────── */
  const { trackRef, thumbRef, prevRef, nextRef, stripRef, wrapRef } = useSlider();
  const SB_MIN = 56;
  const SB_MAX = 360;
  const SB_COLLAPSE = 72;
  const { sidebarRef } = useResizer(SB_MIN, SB_MAX, SB_COLLAPSE);

  const allAvatars = Array.from({ length: 12 }, (_, i) => i + 1);
  const firstAvatar = allAvatars[0];
  const restAvatars = allAvatars.slice(1);

  /* ───────── Refs ───────── */
  const gridRef    = useRef(null);
  const topbarRef  = useRef(null);
  const chipbarRef = useRef(null);

  /* ───────── Data states ───────── */
  const [tripTitle, setTripTitle] = useState('讀取中…');
  const [modalOpen, setModalOpen] = useState(false);

  const [originAttractions, setOriginAttractions] = useState([]); // modal 原始清單（依 country）
  const [attractions, setAttractions] = useState([]);             // modal 顯示清單
  const [selected, setSelected] = useState(new Set());            // modal 勾選
  const [picked, setPicked] = useState([]);                       // 使用者挑選完成後的清單（驅動 Treemap）

  const [search, setSearch] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [form, setForm] = useState({
    name_zh:'', name_en:'', category:'', address:'', budget:'', photo:''
  });

  /* ───────── 排序與分類（僅影響 Sidebar） ───────── */
  const [sortKey, setSortKey] = useState('votes');  // 'votes' | 'pref'
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [catOpen, setCatOpen] = useState(false);
  const catBtnRef = useRef(null);

  /* ───────── 倒數計時 ───────── */
  const [secLeft, setSecLeft] = useState(19 * 60 + 28);
  useEffect(() => {
    if (secLeft <= 0) return;
    const id = setInterval(() => setSecLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [secLeft]);
  const hh = String(Math.floor(secLeft / 3600)).padStart(2, '0');
  const mm = String(Math.floor((secLeft % 3600) / 60)).padStart(2, '0');
  const ss = String(secLeft % 60).padStart(2, '0');

  /* ───────── 新增評論 ───────── */
  const [commentTarget, setCommentTarget] = useState(null);
  const [commentText, setCommentText]     = useState('');

  const handleInput = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const goHome      = () => { setModalOpen(false); setManualMode(false); };
  const toggleSidebar = () => setCollapsed((c) => !c);

  const openCommentModal = (a_id) => {
    setCommentTarget(a_id);
    setCommentText('');
    setCommentModalOpen(true);
  };

  const treemapData = useMemo(() => {
    const pickedIds = new Set(picked.map(p => p.a_id));
    return fullD3Data.filter(d => pickedIds.has(d.a_id));
  }, [fullD3Data, picked]);

  const submitComment = async () => {
    if (!commentText.trim()) return;
    try {
      const { data } = await axios.post('http://localhost:3001/api/comments', {
        attraction_id: commentTarget, user_id: 1, content: commentText.trim()
      });
      if (data.success) {
        setCommentsMap(prev => {
          const prevList = prev[commentTarget] || [];
          return { ...prev, [commentTarget]: [...prevList, { id: data.id, user_id: 1, content: commentText.trim(), created_at: data.created_at }] };
        });
        setCommentModalOpen(false);
        toast.success('已新增評論');
      } else throw new Error(data.error || '新增失敗');
    } catch (err) {
      console.error(err);
      toast.error(err.message || '新增評論錯誤');
    }
  };

  const submitManual = async () => {
    try {
      const payload = { ...form, budget: Number(form.budget) || 0 };
      const { data } = await axios.post('http://localhost:3001/api/attractions', payload);
      if (!data.success) throw new Error(data.error);

      const newSpot = {
        a_id: data.a_id,
        name_zh: form.name_zh, name_en: form.name_en,
        address: form.address, city: data.city, country: data.country,
        photo: form.photo, category: form.category, budget: payload.budget,
      };
      setPicked(prev => [...prev, newSpot]);
      setForm({ name_zh:'', name_en:'', category:'', address:'', budget:'', photo:'' });
      toast.success('已新增並顯示在首頁！');
    } catch (err) {
      console.error('❌ manual insert error', err);
      toast.error(err.message || '新增失敗，請稍後重試');
    }
  };

  /* 讀取標題 */
  useEffect(() => {
    if (!tripId) { setTripTitle('無效的行程 ID'); return; }
    axios.get(`http://localhost:3001/api/trips/${tripId}`)
      .then(res => setTripTitle(res.data.title))
      .catch(()  => setTripTitle('讀取失敗'));
  }, [tripId]);

  useEffect(() => {
  if (!country) return;
  const ctrl = new AbortController();
  (async () => {
    try {
      // 1) 拿 attractions 列表
      const { data: attrs } = await axios.get(
        'http://localhost:3001/api/attractions',
        { params: { country: COUNTRY_MAP[country] || country }, signal: ctrl.signal }
      );
      // 2) 拿完整票數
      const { data: stats } = await axios.get(
        'http://localhost:3001/api/d3',
        { signal: ctrl.signal }
      );
      // 3) 建 map 方便合併
      const byId = new Map(stats.map(r => [r.a_id, r]));
      // 4) 合併
      const merged = attrs.map(a => {
        const s = byId.get(a.a_id) || {};
        // 如果 who_like/ who_love 不是 array，就 parse
        let who_like = Array.isArray(s.who_like) ? s.who_like : JSON.parse(s.who_like||'[]');
        let who_love = Array.isArray(s.who_love) ? s.who_love : JSON.parse(s.who_love||'[]');
        
        // —— 这里开始调试 —— 
   console.log(`🕵️ a_id=${a.a_id}`, { who_like, who_love });
   who_like.forEach((x,i) => console.log(`   who_like[${i}] =`, x, typeof x));
   who_love.forEach((x,i) => console.log(`   who_love[${i}] =`, x, typeof x));
   // —— 调试结束 —— 

        return {
          a_id:      a.a_id,
          name_zh:   a.name_zh,
          name_en:   a.name_en,
          category:  a.category,
          address:   a.address,
          photo:     a.photo,
          vote_like: s.vote_like  ?? 0,
          vote_love: s.vote_love  ?? 0,
          who_like,
          who_love,
          value:     Math.max(1, (s.vote_like||0)+(s.vote_love||0)),
        };
      });
      setFullD3Data(merged);
    } catch (err) {
      if (!axios.isCancel(err)) console.error(err);
    }
  })();
  return () => ctrl.abort();
}, [country]);

  // Treemap 資料更新 → 清空 Sidebar（重新等待點擊）
  useEffect(() => { setSelectedItems([]); }, [d3Data]);

  /* 打開 Modal 讀取景點（依 country） */
  const openModal = async () => {
    fetchCtrl.current?.abort?.();
    fetchCtrl.current = new AbortController();
    const { signal } = fetchCtrl.current;

    setSelected(new Set());
    setSearch('');
    setManualMode(false);
    setModalOpen(true);
    setAttractions([]); setOriginAttractions([]);

    try {
      const queryCountry = COUNTRY_MAP[country] || country || '';
      const { data } = await axios.get('http://localhost:3001/api/attractions', { params: { country: queryCountry }, signal });
      const list = Array.isArray(data) ? data : [];
      setOriginAttractions(list);
      setAttractions(list);
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED' || axios.isCancel?.(err)) return;
      console.error('❌ attractions fetch error:', err);
    }
  };

  useEffect(() => () => fetchCtrl.current?.abort?.(), []);

  /* 初始評論 */
  useEffect(() => {
    axios.get('http://localhost:3001/api/comments')
      .then(({ data }) => {
        const map = {};
        data.forEach(c => {
          if (!map[c.attraction_id]) map[c.attraction_id] = [];
          map[c.attraction_id].push(c);
        });
        setCommentsMap(map);
      })
      .catch(console.error);
  }, []);

  /* Modal 搜尋過濾 */
  useEffect(() => {
    if (!modalOpen || manualMode) return;
    const kw = search.trim().toLowerCase();
    if (!kw) { setAttractions(originAttractions); return; }
    const filtered = originAttractions.filter(a =>
      (a.name_zh || '').toLowerCase().includes(kw) ||
      (a.name_en || '').toLowerCase().includes(kw) ||
      (a.city    || '').toLowerCase().includes(kw)
    );
    setAttractions(filtered);
    setSelected(prev => new Set([...prev].filter(id => filtered.some(a => a.a_id === id))));
  }, [search, modalOpen, manualMode, originAttractions]);

  /* 確認挑選 */
  const toggleSelect = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };
  const confirmPick = () => {
    const sel = new Set(selected);
    const chosen = attractions.filter(a => sel.has(a.a_id));
    setPicked(chosen);
    setSelected(new Set());
    setModalOpen(false);
  };

  /* 分類選單（以 Sidebar 目前資料為準） */
  const categoryOptions = useMemo(() => {
    const pool = selectedItems;
    const set = new Set(pool.map(x => (x.category || '').trim()).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [selectedItems]);

  /* Sidebar 顯示資料（由 Treemap 點選決定） */
  const displayData = useMemo(() => {
    const base = selectedItems;
    let list = (categoryFilter === 'ALL') ? [...base] : base.filter(x => (x.category || '').trim() === categoryFilter);

    const votes = (x) => (x.vote_like || 0) + (x.vote_love || 0);
    const pref  = (x) => (x.vote_love || 0) * 2 + (x.vote_like || 0);
    if (sortKey === 'votes') list.sort((a, b) => votes(b) - votes(a) || (a.name_zh || '').localeCompare(b.name_zh || ''));
    if (sortKey === 'pref')  list.sort((a, b) => pref(b)  - pref(a)  || (a.name_zh || '').localeCompare(b.name_zh || ''));

    return list;
  }, [selectedItems, sortKey, categoryFilter]);

  /* 關閉分類下拉（點外面） */
  useEffect(() => {
    const onDocClick = (e) => {
      if (!catBtnRef.current) return;
      if (!catBtnRef.current.contains(e.target)) setCatOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  /* Treemap 點擊的回調：最多 3 個，去重，最近點擊優先 */
  const handleTreemapSelect = (item) => {
    setSelectedItems(prev => {
      // 去重
      const without = prev.filter(p => p.a_id !== item.a_id);
      // 最新點擊放最前面
      const next = [item, ...without];
      // 限制最多 3 個
      return next.slice(0, 3);
    });
  };

  /* 從 Sidebar 移除某景點 */
  const removeSidebarItem = (a_id) => {
    setSelectedItems(prev => prev.filter(p => p.a_id !== a_id));
  };
  /* ───────── Render ───────── */
  return (
    <div className="page">
      {/* 左上角膠囊：收起/展開 Sidebar */}
      <button
        className="collapse-btn"
        onClick={toggleSidebar}
        aria-label={collapsed ? "展開側邊欄" : "收起側邊權"}
        aria-expanded={!collapsed}
      >
        {collapsed ? '›' : '‹'}
      </button>

      <div className="content-grid" ref={gridRef}>
        {/* 1) Topbar */}
        <header className="topbar" ref={topbarRef}>
          <h1 className="title">🚩{tripTitle}</h1>
          <div className="top-actions">
            <div className="ribbon">選景點</div>
            <div className="countdown" aria-label="倒數計時">
              <span>⌛</span><span className="tbox">{hh}</span><span>:</span>
              <span className="tbox">{mm}</span><span>:</span><span className="tbox">{ss}</span>
            </div>
          </div>
        </header>

        {/* 2) Chipbar */}
        <div className="chipbar" ref={chipbarRef}>
          <SegSwitch value={sortKey} onChange={setSortKey} />

          <div className="chip dropdown" ref={catBtnRef} onClick={() => setCatOpen(o => !o)}>
            {categoryFilter === 'ALL' ? '全部分類' : categoryFilter} <span className="caret">▾</span>
            {catOpen && (
              <div className="dropdown-menu" role="menu">
                {categoryOptions.map((opt) => (
                  <div
                    key={opt}
                    className={`dd-item ${opt === categoryFilter ? 'selected' : ''}`}
                    onClick={() => { setCategoryFilter(opt); setCatOpen(false); }}
                  >
                    {opt === 'ALL' ? '全部分類' : opt}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="btn-primary" onClick={openModal}>
            新增景點 <span className="plus">＋</span>
          </button>
          <button className="btn-ghost">更新</button>
        </div>

        {/* 3) Sidebar */}
        <aside
          id="sidebar"
          ref={sidebarRef}
          className={collapsed ? "collapsed" : ""}
          style={{ width: collapsed ? `${SB_MIN}px` : `${SB_MAX}px` }}
        >
          <div className="sidebar-inner">
            {/* 可選：保留頭像區 */}
            <div className="avatar-row">
              {/* ───── 1. 大頭貼 (uid === '111') ───── */}
              {(() => {
                const uid = `${String(firstAvatar).repeat(3)}`;   // '111'
                return (
                  <div
                    className="avatar-large"
                    id={uid}
                    onClick={() => {
                      console.log('[avatar click] next active =', uid);
                      setActiveUserId(prev => (prev === uid ? null : uid));
                    }}
                    style={{
                      outline: activeUserId === uid ? '3px solid #ff6700' : 'none'
                    }}
                  >
                    <img
                      src={`https://i.pravatar.cc/72?img=${firstAvatar}`}
                      alt="主揪大頭貼"
                      className="avatar-large-img"
                    />
                  </div>
                );
              })()}

              <button className="arrow arrow-left" ref={prevRef} />

              {/* ───── 2. 小頭貼 (其餘使用者) ───── */}
              <div className="avatar-strip-wrap" ref={wrapRef}>
                <div className="avatar-strip" ref={stripRef}>
                  {restAvatars.map(i => {
                    const uid = `${String(i).repeat(3)}`;         // '222', '333', …
                    return (
                      <div
                        key={i}
                        className="avatar"
                        id={uid}
                        onClick={() => {
                          console.log('[avatar click] next active =', uid);
                          setActiveUserId(prev => (prev === uid ? null : uid));
                        }}
                        style={{
                          outline: activeUserId === uid ? '3px solid #ff6700' : 'none'
                        }}
                      >
                        <img
                          src={`https://i.pravatar.cc/44?img=${i}`}
                          alt="頭貼"
                          className="avatar-img"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <button className="arrow arrow-right" ref={nextRef} />
            </div>

            {/* 只顯示使用者點選的（最多 3 個） */}
            <div className="rec-list">
              {displayData.map((it) => {
                // 獲取當前景點的所有評論
                const cmts = commentsMap[it.a_id] || [];
                
                // 【修改點 1】判斷當前的卡片是否處於展開狀態
                // expandedComments 是一個物件，key 是 a_id，value 是 true/false
                const isExpanded = !!expandedComments[it.a_id];

                // 【修改點 2】定義一個處理點擊事件的函式
                const toggleExpand = () => {
                  setExpandedComments(prev => ({
                    ...prev, // 保留其他卡片的狀態
                    [it.a_id]: !isExpanded // 將當前卡片的狀態反轉
                  }));
                };

                return (
                  <div className="rec-card" key={it.a_id} style={{ position: 'relative' }}>
                    {/* 右上角刪除按鈕 */}
                    <button
                      className="rec-close"
                      aria-label="移除這個景點"
                      onClick={(e) => { e.stopPropagation(); removeSidebarItem(it.a_id); }}
                    >
                      一
                    </button>

                    {/* 1) 標題 + 地址 + 照片 (保持不變) */}
                    <div className="rec-head">
                      <div className="rec-title">
                        <span className="zh">{it.name_zh}</span><span className="sep"> | </span><span className="en">{it.name_en}</span>
                      </div>
                      <div className="rec-addr">📍 {it.address || '地址未提供'}</div>
                      <div className="rec-photo">
                        <img src={it.photo || `https://picsum.photos/seed/p${it.a_id}/132/88`} alt={it.name_zh} />
                      </div>
                    </div>

                    {/* 2 ) 留言 */}
                    <div className="rec-comment">
                      <div className="cmt">
                        {/* 【修改點 3】根據 isExpanded 狀態決定顯示所有評論還是只顯示最新一條 */}
                        {(isExpanded ? cmts : cmts.slice(-1)).map(c => (
                          <div key={c.id}>
                            <div className="name">{c.user_id || '匿名'}</div>
                            <div className="txt">{c.content}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 3) 按鈕 */}
                    <div className="rec-actions">
                      <button className="btn-sm ghost" onClick={() => openCommentModal(it.a_id)}>增加評論</button>
                      
                      {/* 【修改點 4】根據評論數量 > 1 的條件渲染動態按鈕 */}
                      {cmts.length > 1 && (
                        <button className="btn-sm primary" onClick={toggleExpand}>
                          {isExpanded ? '顯示更少' : '顯示更多'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </aside>

        {/* 4) Treemap（右側主板） */}
        <section className="board" id="treemap-container">
          {picked.length > 0 ? (
            treemapData.length > 0 ? (
              <Treemap
                // 移除 width 和 height props
                key={[treemapData.map(d => d.a_id).join('_'), activeUserId].join('-')}
                data={treemapData}
                onSelect={handleTreemapSelect}
                activeUserId={activeUserId}
              />
            ) : (
              <div className="placeholder">載入中…</div>
            )
          ) : (
            <div className="placeholder">請先按「新增景點」並確認您的選擇</div>
          )}
        </section>

      </div>

      {/* ===== Modal ===== */}
      {modalOpen && (
        <div className="modal-mask" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{manualMode ? '手動輸入景點' : '選擇景點'}</h3>

            {manualMode ? (
              <>
                <div className="manual-form">
                  <div className="row">
                    <label htmlFor="f-zh">➡️ 中文名稱
                      <input id="f-zh" name="name_zh" value={form.name_zh || ''} onChange={handleInput} />
                    </label>
                    <label>➡️ 英文名稱
                      <input name="name_en" value={form.name_en} onChange={handleInput} />
                    </label>
                  </div>
                  <label>📍地址 <input name="address" value={form.address} onChange={handleInput} /></label>
                  <label>📸 照片 URL <input name="photo" value={form.photo} onChange={handleInput} /></label>
                  <div className="row">
                    <label>🗃️ 分類 <input name="category" value={form.category} onChange={handleInput} /></label>
                    <label>💰 預算 <input type="number" name="budget" value={form.budget || ''} onChange={handleInput} min="0" step="1" /></label>
                  </div>
                </div>

                <div className="btn-group">
                  <button className="hand-btn" onClick={() => setManualMode(false)}>← 返回</button>
                  <button className="home-btn" onClick={goHome}>首頁</button>
                  <button className="confirm-btn" onClick={submitManual}>送出</button>
                </div>
              </>
            ) : (
              <>
                <div className="search-bar">
                  <input type="text" placeholder="輸入關鍵字搜尋…" value={search} onChange={(e) => setSearch(e.target.value)} />
                  <span className="icon">🔍</span>
                </div>

                <div className="attraction-list">
                  {attractions.map((at) => (
                    <div
                      key={at.a_id}
                      className={`attraction-card ${selected.has(at.a_id) ? 'active' : ''}`}
                      onClick={() => toggleSelect(at.a_id)}
                    >
                      <img src={at.photo || `https://picsum.photos/seed/a${at.a_id}/80/80`} alt={at.name_zh} />
                      <div className="info">
                        <span className="name">{at.name_zh} | {at.name_en}</span>
                        <span className="addr">📍 {at.address}</span>
                      </div>
                      {selected.has(at.a_id) && <span className="tick">✔</span>}
                    </div>
                  ))}
                  {attractions.length === 0 && <p className="empty">（沒有資料 / 讀取失敗）</p>}
                </div>

                <div className="btn-group">
                  <button className="hand-btn" onClick={() => setManualMode(true)}>手動輸入</button>
                  <button className="confirm-btn" onClick={confirmPick}>確定</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== 新增評論 Modal ===== */}
      {commentModalOpen && (
        <div className="modal-mask" onClick={() => setCommentModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">新增評論</h3>
            <div className="comment-form">
              <textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="輸入您的評論…" />
            </div>
            <div className="btn-group">
              <button className="hand-btn" onClick={() => setCommentModalOpen(false)}>取消</button>
              <button className="confirm-btn" onClick={submitComment}>送出</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
