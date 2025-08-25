// ======================== Imports & 基本常數 ========================
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

import './part2.css';
import { TreemapChart } from './treemap_chyi.jsx';    // ← 與 JSX 一致
import { useSlider } from './slider';

const COUNTRY_MAP = { '瑞士': 'Switzerland', '日本': 'Japan', '台灣': 'Taiwan' };

// ======================== UI 小元件：排序切換 ========================
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
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [isRight, value]);

  return (
    <div className={`seg-switch ${isRight ? 'is-right' : 'is-left'}`} ref={ref} role="tablist" aria-label="排序切換" tabIndex={0}>
      <span className={`seg ${!isRight ? 'active' : ''}`} role="tab" aria-selected={!isRight} onClick={setLeft}>
        <svg className="seg-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h3V10H4v10zm6 0h3V4h-3v16zm6 0h3v-7h-3v7z" /></svg>
        景點投票人數
      </span>
      <span className={`seg ${isRight ? 'active' : ''}`} role="tab" aria-selected={isRight} onClick={setRight}>
        <svg className="seg-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.1 21.35l-1.1-1.02C5.4 15.36 2 12.28 2 8.5A4.5 4.5 0 0 1 6.5 4c1.74 0 3.41.81 4.5 2.09A6 6 0 0 1 22 8.5c0 3.78-3.4 6.86-8.9 11.83l-1 .92z" /></svg>
        偏好程度
      </span>
      <span className={`seg-indicator ${isRight ? 'right' : 'left'}`} aria-hidden="true" />
      <button className="seg-hit" aria-label="切換排序" onClick={toggle} tabIndex={-1} />
    </div>
  );
}

// 類別對應的背景漸層（側欄 legend 用）
function neonStops(cat) {
  let startColor = '#ddd', endColor = '#aaa';
  switch ((cat || '').trim()) {
    case 'Culture & Heritage': startColor = '#ffdfba'; endColor = '#ffbf69'; break;
    case 'Scenic Spots':       startColor = '#bae1ff'; endColor = '#baffc9'; break;
    case 'Transport Rides':    startColor = '#f9a1bc'; endColor = '#fbc4ab'; break;
    case 'Discovery Spaces':   startColor = '#dcd6f7'; endColor = '#a6b1e1'; break;
    case 'Public Squares':     startColor = '#c77dff'; endColor = '#ffd6ff'; break;
  }
  return { startColor, endColor };
}

// ======================== 主元件 ========================
export default function Part2({ tripId, country }) {

  // ---------- Refs & 版面/操作狀態 ----------
  const fetchCtrl = useRef(null);
  const gridRef = useRef(null);
  const topbarRef = useRef(null);
  const chipbarRef = useRef(null);
  const sidebarRef = useRef(null);
  const catBtnRef = useRef(null);
  const searchWrapRef = useRef(null);
  const { prevRef, nextRef, stripRef, wrapRef } = useSlider();

  const [collapsed, setCollapsed] = useState(false);
  const toggleSidebar = () => setCollapsed(c => !c);

  // ---------- 基本顯示：旅程標題 / 倒數 / Refresh ----------
  const [tripTitle, setTripTitle] = useState('讀取中…');

  const [secLeft, setSecLeft] = useState(19 * 60 + 28);
  const hh = String(Math.floor(secLeft / 3600)).padStart(2, '0');
  const mm = String(Math.floor((secLeft % 3600) / 60)).padStart(2, '0');
  const ss = String(secLeft % 60).padStart(2, '0');

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = () => { if (!refreshing) { setRefreshing(true); setTimeout(() => setRefreshing(false), 800); } };

  // ---------- 使用者頭像（多選） ----------
  const allAvatars = Array.from({ length: 12 }, (_, i) => i + 1);
  const firstAvatar = allAvatars[0];
  const restAvatars = allAvatars.slice(1);
  const [activeUserIds, setActiveUserIds] = useState(new Set());
  const toggleUser = (uid) => setActiveUserIds(prev => { const next = new Set(prev); next.has(uid) ? next.delete(uid) : next.add(uid); return next; });
  const clearUsers = () => setActiveUserIds(new Set());
  const activeUserId = [...activeUserIds][0] || null;

  // ---------- 新增景點（Modal） ----------
  const [modalOpen, setModalOpen] = useState(false);
  const [originAttractions, setOriginAttractions] = useState([]);
  const [attractions, setAttractions] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [picked, setPicked] = useState([]);
  const [manualMode, setManualMode] = useState(false);
  const [search, setSearch] = useState('');
  const CATEGORY_OPTIONS = ['History & Religion','Scenic Spots','Art & Museums','Transport Rides'];
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [selectedCats, setSelectedCats] = useState(new Set());
  const [form, setForm] = useState({ name_zh:'', name_en:'', category:'', address:'', budget:'', photo:'', comment:'', link:'' });

  // ---------- Treemap 與選取 ----------
  const [fullD3Data, setFullD3Data] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  // ---------- 留言 / 連結 ----------
  const [commentsMap, setCommentsMap] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentTarget, setCommentTarget] = useState(null);
  const [commentText, setCommentText] = useState('');

  const [linksMap, setLinksMap] = useState({});
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkTarget, setLinkTarget] = useState(null);
  const [linkText, setLinkText] = useState('');

  // ---------- 其他 UI：Legend / 完成彈窗 ----------
  const [showLegend, setShowLegend] = useState(false);
  const [onlyPicked, setOnlyPicked] = useState(false);
  const [doneModalOpen, setDoneModalOpen] = useState(false);
  const closeDoneModal = () => { setDoneModalOpen(false); setOnlyPicked(false); };

  // ---------- Chipbar：排序 / 分類 ----------
  const [sortKey, setSortKey] = useState('votes');
  const [categoryFilters, setCategoryFilters] = useState(new Set(['ALL']));
  const [catOpen, setCatOpen] = useState(false);
  const CHIP_CATEGORY_OPTIONS = ['History & Religion','Scenic Spots','Art & Museums','Transport Rides'];
  const chipLabel = useMemo(() => {
    if (categoryFilters.has('ALL')) return '全部分類';
    const names = [...categoryFilters].filter(c => c !== 'ALL');
    return names.length ? names.join('、') : '全部分類';
  }, [categoryFilters]);

  // ======================== Effects：資料/事件註冊 ========================
  // 旅程標題
  useEffect(() => {
    if (!tripId) { setTripTitle('無法讀取旅程名稱'); return; }
    axios.get(`http://localhost:3001/api/trips/${tripId}`)
      .then(res => setTripTitle(res.data.title))
      .catch(()  => setTripTitle('讀取失敗'));
  }, [tripId]);

  // 倒數
  useEffect(() => {
    if (secLeft <= 0) return;
    const id = setInterval(() => setSecLeft(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [secLeft]);

  // 點文件關閉 Chip 下拉
  useEffect(() => {
    const onDocClick = (e) => { if (catBtnRef.current && !catBtnRef.current.contains(e.target)) setCatOpen(false); };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // 點文件關閉 Modal 類別選單
  useEffect(() => {
    const onDocClick = (e) => { if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) setCatMenuOpen(false); };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // 初始留言載入
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

  // 完成彈窗的快捷鍵
  useEffect(() => {
    if (!doneModalOpen) return;
    const onKey = (e) => { if (e.key === 'Escape' || e.key === 'Enter') closeDoneModal(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [doneModalOpen]);

  // ======================== 資料讀取 / 提交函式 ========================
  // 打開「新增景點」並抓清單
  const openModal = async () => {
    fetchCtrl.current?.abort?.();
    fetchCtrl.current = new AbortController();
    const { signal } = fetchCtrl.current;

    setSelected(new Set()); setSearch(''); setManualMode(false);
    setModalOpen(true); setSelectedCats(new Set()); setCatMenuOpen(false);
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

  // 手動新增景點（可同時新增一則留言與連結）
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

      if (form.comment?.trim()) {
        const { data: cRes } = await axios.post('http://localhost:3001/api/comments', {
          attraction_id: data.a_id, user_id: 1, content: form.comment.trim()
        });
        if (cRes?.success) {
          setCommentsMap(prev => {
            const list = prev[data.a_id] || [];
            return { ...prev, [data.a_id]: [...list, { id: cRes.id, user_id: 1, content: form.comment.trim(), created_at: cRes.created_at }] };
          });
        }
      }

      if (form.link?.trim()) {
        const { data: lRes } = await axios.post('http://localhost:3001/api/links', {
          attraction_id: data.a_id, user_id: 1, xontent: form.link.trim()
        });
        if (lRes?.success) {
          setLinksMap(prev => {
            const list = prev[data.a_id] || [];
            return { ...prev, [data.a_id]: [...list, { id: lRes.id, user_id: 1, xontent: form.link.trim(), created_at: lRes.created_at }] };
          });
        }
      }

      setForm({ name_zh:'', name_en:'', category:'', address:'', budget:'', photo:'', comment:'', link:'' });
      toast.success('已新增並顯示在首頁！');
    } catch (err) {
      console.error('❌ manual insert error', err);
      toast.error(err.message || '新增失敗，請稍後重試');
    }
  };

  // Treemap 合併資料（/api/attractions + /api/d3）
  const loadTreemapData = useCallback(async (abortSignal) => {
    if (!country) return;                             // 若需要無條件顯示，可拿掉這行
    const countryParam = COUNTRY_MAP[country] || country;

    try {
      const [{ data: attrs }, { data: stats }] = await Promise.all([
        axios.get('http://localhost:3001/api/attractions', { params: { country: countryParam }, signal: abortSignal }),
        axios.get('http://localhost:3001/api/d3',           { params: { t_id: tripId || 1 },        signal: abortSignal }),
      ]);

      const byId = new Map((Array.isArray(stats) ? stats : []).map(r => [r.a_id, r]));
      const safeArr = (v) => { if (Array.isArray(v)) return v; if (!v) return []; try { const t = JSON.parse(v); return Array.isArray(t) ? t : []; } catch { return []; } };

      const merged = (Array.isArray(attrs) ? attrs : []).map(a => {
        const s = byId.get(a.a_id) || {};
        const vote_like = Number(s.vote_like ?? 0);
        const vote_love = Number(s.vote_love ?? 0);
        return {
          t_id: s.t_id ?? tripId,
          a_id: a.a_id,
          name_zh: a.name_zh,
          name_en: a.name_en,
          category: a.category,
          address: a.address,
          photo: a.photo,
          vote_like,
          vote_love,
          who_like: safeArr(s.who_like),
          who_love: safeArr(s.who_love),
          value: Math.max(1, vote_like + vote_love),
        };
      });
      setFullD3Data(merged);
    } catch (err) {
      if (!axios.isCancel(err)) console.error('treemap load error:', err);
    }
  }, [country, tripId]);

  useEffect(() => {
    const ctrl = new AbortController();
    loadTreemapData(ctrl.signal);
    return () => ctrl.abort();
  }, [loadTreemapData]);

  // 送出留言 / 連結
  const openCommentModal = (a_id) => { setCommentTarget(a_id); setCommentText(''); setCommentModalOpen(true); };
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

  const openLinkModal  = (a_id) => { setLinkTarget(a_id); setLinkText(''); setLinkModalOpen(true); };
  const closeLinkModal = () => setLinkModalOpen(false);
  const submitLink = async () => {
    if (!linkText.trim()) return;
    try {
      const { data } = await axios.post('http://localhost:3001/api/links', {
        attraction_id: linkTarget, user_id: 1, xontent: linkText.trim()
      });
      if (data.success) {
        setLinksMap(prev => {
          const prevList = prev[linkTarget] || [];
          return { ...prev, [linkTarget]: [...prevList, { id: data.id, user_id: 1, xontent: linkText.trim(), created_at: data.created_at }] };
        });
        setLinkModalOpen(false);
        toast.success('已新增連結');
      } else throw new Error(data.error);
    } catch (err) {
      console.error(err);
      toast.error(err.message || '新增連結失敗');
    }
  };

  // ======================== 事件處理 / 小工具 ========================
  const handleInput = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const goHome = () => { setModalOpen(false); setManualMode(false); };
  const toggleSelect = (id) => { const next = new Set(selected); next.has(id) ? next.delete(id) : next.add(id); setSelected(next); };
  const confirmPick = () => { const sel = new Set(selected); const chosen = attractions.filter(a => sel.has(a.a_id)); setPicked(chosen); setSelected(new Set()); setModalOpen(false); };
  const handleTreemapSelect = useCallback((item) => setSelectedItems([item]), []);
  const removeSidebarItem = (a_id) => setSelectedItems(prev => prev.filter(p => p.a_id !== a_id));

  // ======================== Memo：衍生資料 ========================
  // Modal：搜尋/篩選
  useEffect(() => {
    if (!modalOpen || manualMode) return;
    const kw = search.trim().toLowerCase();
    const norm = (s) => (s || '').trim().toLowerCase();
    let filtered = originAttractions;

    if (selectedCats.size > 0) filtered = filtered.filter(a => selectedCats.has(norm(a.category)));
    if (kw) filtered = filtered.filter(a =>
      (a.name_zh || '').toLowerCase().includes(kw) ||
      (a.name_en || '').toLowerCase().includes(kw) ||
      (a.city    || '').toLowerCase().includes(kw)
    );

    setAttractions(filtered);
    setSelected(prev => new Set([...prev].filter(id => filtered.some(a => a.a_id === id))));
  }, [search, modalOpen, manualMode, originAttractions, selectedCats]);

  // Treemap 顯示資料（只顯示已挑選；要顯示全部可改用 fullD3Data）
  const treemapData = useMemo(() => {
    const pickedIds = new Set(picked.map(p => p.a_id));
    let list = fullD3Data.filter(d => pickedIds.has(d.a_id));
    if (!categoryFilters.has('ALL')) list = list.filter(d => categoryFilters.has((d.category || '').trim()));
    return list;
  }, [fullD3Data, picked, categoryFilters]);

  // 側欄顯示清單（排序/過濾）
  const displayData = useMemo(() => {
    const base = selectedItems;
    let list = categoryFilters.has('ALL') ? [...base] : base.filter(x => categoryFilters.has((x.category || '').trim()));
    const votes = (x) => (x.vote_like || 0) + (x.vote_love || 0);
    const pref  = (x) => (x.vote_love || 0) * 2 + (x.vote_like || 0);
    if (sortKey === 'votes') list.sort((a, b) => votes(b) - votes(a) || (a.name_zh || '').localeCompare(b.name_zh || ''));
    if (sortKey === 'pref')  list.sort((a, b) => pref(b)  - pref(a)  || (a.name_zh || '').localeCompare(b.name_zh || ''));
    return list;
  }, [selectedItems, sortKey, categoryFilters]);

  // ======================== Render ========================
  return (
    <div className="page">
      <div className="content-grid" ref={gridRef}>

        {/* Topbar */}
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

        {/* Chipbar */}
        <div className="chipbar" ref={chipbarRef}>
          <SegSwitch value={sortKey} onChange={setSortKey} />
          <div className={`chip dropdown ${catOpen ? 'open' : ''}`} ref={catBtnRef} onClick={() => setCatOpen(o => !o)}>
            {chipLabel}<span className="caret">▾</span>
            {catOpen && (
              <div className="dropdown-menu categories" role="menu" onClick={(e) => e.stopPropagation()}>
                <div className="cat-list">
                  {['ALL', ...CHIP_CATEGORY_OPTIONS].map((opt) => {
                    const isSelected = categoryFilters.has(opt);
                    const handleToggle = (e) => {
                      e.stopPropagation();
                      setCategoryFilters((prev) => {
                        const next = new Set(prev);
                        if (opt === 'ALL') return new Set(['ALL']);
                        if (next.has('ALL')) next.delete('ALL');
                        if (isSelected) { next.delete(opt); if (next.size === 0) next.add('ALL'); }
                        else next.add(opt);
                        return next;
                      });
                    };
                    return (
                      <label key={opt} className={`cat-item ${isSelected ? 'checked' : ''}`} onClick={handleToggle}>
                        <input type="checkbox" checked={isSelected} readOnly />
                        <span>{opt === 'ALL' ? '全部分類' : opt}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="menu-actions">
                  <button type="button" className="btn-clean" onClick={(e) => { e.stopPropagation(); setCategoryFilters(new Set(['ALL'])); }}>清除</button>
                  <button type="button" className="btn-done"  onClick={(e) => { e.stopPropagation(); setCatOpen(false); }}>完成</button>
                </div>
              </div>
            )}
          </div>

          <button type="button" className="button" onClick={openModal} aria-haspopup="dialog" aria-controls="add-spot-modal" aria-expanded={modalOpen}>
            <span className="button__text">新增景點</span>
            <span className="button__icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </span>
          </button>

          <div id="fileLoadIndicator">
            <button id="id_block_refresh" className={`block-refresh ${refreshing ? 'is-spinning' : ''}`} onClick={handleRefresh} aria-label="更新">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-2.64-6.36" /><polyline points="21 3 21 9 15 9" />
              </svg>
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <aside id="sidebar" ref={sidebarRef} className={collapsed ? "collapsed" : ""}>
          <div className="sidebar-inner">
            {/* 頭像列 */}
            <div className="avatar-row">
              {(() => {
                const uid = `${String(firstAvatar).repeat(3)}`;
                return (
                  <div className={`avatar-large ${activeUserIds.size>0 ? (activeUserIds.has(uid) ? 'is-selected' : 'is-dim') : ''}`} id={uid} onClick={() => toggleUser(uid)} aria-pressed={activeUserIds.has(uid)}>
                    <img src={`https://i.pravatar.cc/72?img=${firstAvatar}`} alt="主揪大頭貼" className="avatar-large-img" />
                  </div>
                );
              })()}
              <button className="arrow arrow-left" ref={prevRef} />
              <div className="avatar-strip-wrap" ref={wrapRef}>
                <div className="avatar-strip" ref={stripRef}>
                  {restAvatars.map(i => {
                    const uid = `${String(i).repeat(3)}`;
                    return (
                      <div key={i} className={`avatar ${activeUserIds.size>0 ? (activeUserIds.has(uid) ? 'is-selected' : 'is-dim') : ''}`} id={uid} onClick={() => toggleUser(uid)} aria-pressed={activeUserIds.has(uid)}>
                        <img src={`https://i.pravatar.cc/44?img=${i}`} alt="頭貼" className="avatar-img" />
                      </div>
                    );
                  })}
                </div>
              </div>
              <button className="arrow arrow-right" ref={nextRef} />
              <div className="avatar-tools">
                <span className="pill">已選 {activeUserIds.size} 人</span>
                <button type="button" className="btn-link small" onClick={clearUsers} disabled={activeUserIds.size===0}>清除</button>
              </div>
            </div>

            {/* 推薦/資訊卡片或 Legend */}
            <div className="rec-list">
              {showLegend ? (
                <div className="legend-panel" role="list" aria-label="類別與顏色對照">
                  {['Culture & Heritage','Scenic Spots','Transport Rides','Discovery Spaces','Public Squares'].map((name) => {
                    const { startColor, endColor } = neonStops(name);
                    const bg = `linear-gradient(90deg, ${startColor}, ${endColor})`;
                    return (
                      <div className="legend-item" role="listitem" key={name}>
                        <span className="legend-swatch" style={{ background: bg }} aria-hidden="true" />
                        <div className="legend-meta"><div className="legend-name">{name}</div><div className="legend-hex">{startColor} → {endColor}</div></div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <>
                  {displayData.map((it) => {
                    const cmts = commentsMap[it.a_id] || [];
                    return (
                      <div className="rec-card" key={it.a_id} style={{ position: 'relative' }}>
                        <button className="rec-close" aria-label="移除這個景點" onClick={(e) => { e.stopPropagation(); removeSidebarItem(it.a_id); }}>一</button>
                        <div className="rec-head">
                          <div className="rec-title"><span className="zh">{it.name_zh}</span><span className="sep"> | </span><span className="en">{it.name_en}</span></div>
                          <div className="rec-addr">📍 {it.address || '地址未提供'}</div>
                          <div className="rec-photo"><img src={it.photo || `https://picsum.photos/seed/p${it.a_id}/132/88`} alt={it.name_zh} /></div>
                        </div>
                        <div className="rec-comment">
                          <div className="rec-sec-head">
                            <div className="rec-sec-title">💬 評論</div>
                            <button className="icon-btn add-btn tiny" onClick={() => openCommentModal(it.a_id)}><div className="add-icon"></div><div className="btn-txt">新增評論</div></button>
                          </div>
                          <div className="cmt">
                            {cmts.map(c => (<div key={c.id}><div className="name">{c.user_id || '匿名'}</div><div className="txt">{c.content}</div></div>))}
                          </div>
                        </div>
                        <div className="rec-comment">
                          <div className="rec-sec-head">
                            <div className="rec-sec-title">🔗 連結</div>
                            <button className="icon-btn add-btn tiny" onClick={() => openLinkModal(it.a_id)}><div className="add-icon"></div><div className="btn-txt">新增連結</div></button>
                          </div>
                          <div className="cmt">
                            {(linksMap[it.a_id] || []).map(l => (
                              <div key={l.id}><div className="name">{l.user_id}</div><div className="txt"><a href={l.xontent} target="_blank" rel="noreferrer">{l.xontent}</a></div></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <div className="sidebar-footer">
              <button type="button" className="btn-primary small" onClick={() => setShowLegend(v => !v)} aria-pressed={showLegend}>
                {showLegend ? '顯示景點資訊' : '類別顏色對照表'}
              </button>
              <button type="button" className="btn-primary small" onClick={() => { setOnlyPicked(true); setDoneModalOpen(true); }}>
                選擇完畢
              </button>
            </div>
          </div>
        </aside>

        {/* Treemap 主畫面 */}
        <section className="board" id="treemap-container">
          {picked.length === 0 ? (
            <div className="placeholder">請先按「新增景點」並確認您的選擇</div>
          ) : treemapData.length === 0 ? (
            <div className="placeholder">此分類目前沒有已挑選的景點</div>
          ) : (
            <TreemapChart
              data={treemapData}
              width={900}
              height={520}
              onRefresh={() => loadTreemapData()}   // Treemap 內部動作（投票）完畢後可呼叫
              onSelect={handleTreemapSelect}
              activeUserId={activeUserId}
              activeUserIds={[...activeUserIds]}
              sortKey={sortKey}
              selectedIds={selectedItems.map(x => x.a_id)}
            />
          )}
        </section>
      </div>

      {/* ====== Modals：新增景點 ====== */}
      {modalOpen && (
        <div className="modal-mask" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{manualMode ? '手動輸入景點' : '選擇景點'}</h3>

            {manualMode ? (
              <>
                <div className="manual-form">
                  <div className="row">
                    <label htmlFor="f-zh">➡️ 中文名稱<input id="f-zh" name="name_zh" value={form.name_zh || ''} onChange={handleInput} /></label>
                    <label>➡️ 英文名稱<input name="name_en" value={form.name_en} onChange={handleInput} /></label>
                  </div>
                  <label>📍地址 <input name="address" value={form.address} onChange={handleInput} /></label>
                  <label>📸 照片 URL <input name="photo" value={form.photo} onChange={handleInput} /></label>
                  <div className="row">
                    <label>🗃️ 分類 <input name="category" value={form.category} onChange={handleInput} /></label>
                    <label>💰 預算 <input type="number" name="budget" value={form.budget || ''} onChange={handleInput} min="0" step="1" /></label>
                  </div>
                  <label>💬 評論<textarea name="comment" value={form.comment} onChange={handleInput} /></label>
                  <label>🔗 相關連結<input name="link" type="url" placeholder="https://…" value={form.link} onChange={handleInput} /></label>
                </div>

                <div className="btn-group">
                  <button className="hand-btn" onClick={() => setManualMode(false)}>← 返回</button>
                  <button className="home-btn" onClick={goHome}>首頁</button>
                  <button className="confirm-btn" onClick={submitManual}>送出</button>
                </div>
              </>
            ) : (
              <>
                {/* 搜尋 + 類別多選 */}
                <div className="search-bar with-dropdown" ref={searchWrapRef}>
                  <input type="text" placeholder="輸入關鍵字搜尋…" value={search} onChange={(e) => setSearch(e.target.value)} onFocus={() => setCatMenuOpen(true)} onClick={() => setCatMenuOpen(true)} />
                  {catMenuOpen && (
                    <div className="dropdown categories" role="menu" aria-label="類別過濾">
                      <div className="cat-list">
                        {CATEGORY_OPTIONS.map(opt => {
                          const key = opt.toLowerCase();
                          const checked = selectedCats.has(key);
                          const toggle = () => setSelectedCats(prev => { const next = new Set(prev); checked ? next.delete(key) : next.add(key); return next; });
                          return (
                            <label key={opt} className={`cat-item ${checked ? 'checked' : ''}`}>
                              <input type="checkbox" checked={checked} onChange={toggle} /><span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                      <div className="menu-actions">
                        <button type="button" className="btn-clean" onClick={() => setSelectedCats(new Set())}>清除</button>
                        <button type="button" className="btn-done"  onClick={() => setCatMenuOpen(false)}>完成</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 清單 */}
                <div className="attraction-list">
                  {attractions.map((at) => (
                    <div key={at.a_id} className={`attraction-card ${selected.has(at.a_id) ? 'active' : ''}`} onClick={() => toggleSelect(at.a_id)}>
                      <img src={at.photo || `https://picsum.photos/seed/a${at.a_id}/80/80`} alt={at.name_zh} />
                      <div className="info"><span className="name">{at.name_zh} | {at.name_en}</span><span className="addr">📍 {at.address}</span></div>
                      {selected.has(at.a_id) && <span className="tick">✔</span>}
                    </div>
                  ))}
                  {attractions.length === 0 && <p className="empty">資料庫讀取失敗</p>}
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

      {/* ====== Modals：留言 / 連結 / 完成 ====== */}
      {commentModalOpen && (
        <div className="modal-mask" onClick={() => setCommentModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">新增評論</h3>
            <div className="comment-form"><textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="輸入您的評論…" /></div>
            <div className="btn-group"><button className="hand-btn" onClick={() => setCommentModalOpen(false)}>取消</button><button className="confirm-btn" onClick={submitComment}>送出</button></div>
          </div>
        </div>
      )}

      {linkModalOpen && (
        <div className="modal-mask" onClick={closeLinkModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">新增連結</h3>
            <div className="comment-form"><input type="url" placeholder="輸入連結網址…" value={linkText} onChange={e => setLinkText(e.target.value)} style={{ width: '100%', padding: '8px', fontSize: '14px' }} /></div>
            <div className="btn-group"><button className="hand-btn" onClick={closeLinkModal}>取消</button><button className="confirm-btn" onClick={submitLink}>送出</button></div>
          </div>
        </div>
      )}

      {doneModalOpen && (
        <div className="modal-mask" onClick={closeDoneModal}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">景點選擇完畢</h3>
            <p style={{ margin: '0 0 8px' }}>時間倒數計時 ⌛<b>{hh}:{mm}:{ss}</b></p>
            <p style={{ margin: '0 0 16px' }}>請稍候，等待其他團員完成景點選擇。</p>
            <div className="btn-con"><button className="confirm-btn" onClick={closeDoneModal}>繼續選擇景點</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
