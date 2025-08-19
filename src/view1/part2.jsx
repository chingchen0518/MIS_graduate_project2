import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

import './part2.css';
import Treemap from './treemap.jsx';

import { useSlider }  from './slider';

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
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [isRight, value]);

  return (
    <div
      className={`seg-switch ${isRight ? 'is-right' : 'is-left'}`}
      ref={ref}
      role="tablist"
      aria-label="排序切換"
      tabIndex={0}
    >
      <span
        className={`seg ${!isRight ? 'active' : ''}`}
        role="tab"
        aria-selected={!isRight}
        onClick={setLeft}
      >
        <svg className="seg-ico" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 20h3V10H4v10zm6 0h3V4h-3v16zm6 0h3v-7h-3v7z" />
        </svg>
        景點投票人數
      </span>

      <span
        className={`seg ${isRight ? 'active' : ''}`}
        role="tab"
        aria-selected={isRight}
        onClick={setRight}
      >
        <svg className="seg-ico" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12.1 21.35l-1.1-1.02C5.4 15.36 2 12.28 2 8.5A4.5 4.5 0 0 1 6.5 4c1.74 0 3.41.81 4.5 2.09A6 6 0 0 1 22 8.5c0 3.78-3.4 6.86-8.9 11.83l-1 .92z" />
        </svg>
        偏好程度
      </span>

      <span
        className={`seg-indicator ${isRight ? 'right' : 'left'}`}
        aria-hidden="true"
      />
      <button
        className="seg-hit"
        aria-label="切換排序"
        onClick={toggle}
        tabIndex={-1}
      />
    </div>
  );
}

// ───────── 與 Treemap 一致的類別漸層色 ─────────
function neonStops(cat) {
  let startColor = '#ddd';
  let endColor   = '#aaa';
  switch ((cat || '').trim()) {
    case 'Culture & Heritage': startColor = '#ffdfba'; endColor = '#ffbf69'; break;
    case 'Scenic Spots':       startColor = '#bae1ff'; endColor = '#baffc9'; break;
    case 'Transport Rides':    startColor = '#f9a1bc'; endColor = '#fbc4ab'; break;
    case 'Discovery Spaces':   startColor = '#dcd6f7'; endColor = '#a6b1e1'; break;
    case 'Public Squares':     startColor = '#c77dff'; endColor = '#ffd6ff'; break;
  }
  return { startColor, endColor };
}

export default function Part2({ tripId, country }) {

  /* === const === */
  const fetchCtrl = useRef(null);
  const [collapsed, setCollapsed] = useState(false);

  /* ───────── Refs ───────── */
  const gridRef    = useRef(null);
  const topbarRef  = useRef(null);
  const chipbarRef = useRef(null);

  /* ───────── 讀取旅程標題 ───────── */
  const [tripTitle, setTripTitle] = useState('讀取中…');

  /* ───────── 倒數計時 ───────── */
  const [secLeft, setSecLeft] = useState(19 * 60 + 28);
  const hh = String(Math.floor(secLeft / 3600)).padStart(2, '0');
  const mm = String(Math.floor((secLeft % 3600) / 60)).padStart(2, '0');
  const ss = String(secLeft % 60).padStart(2, '0');

  /* ───────── Refresh ───────── */
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  /* ───────── Layout constants (Sidebar) ───────── */
  const { thumbRef, prevRef, nextRef, stripRef, wrapRef } = useSlider();
  const sidebarRef = useRef(null);   

  /* ───────── 排序與分類（僅影響 Sidebar） ───────── */
  const [sortKey, setSortKey] = useState('votes');
  const [categoryFilters, setCategoryFilters] = useState(new Set(['ALL']));
  const [catOpen, setCatOpen] = useState(false);
  const catBtnRef = useRef(null);

  /* ───────── 頭像（支援多選） ───────── */
  const allAvatars = Array.from({ length: 12 }, (_, i) => i + 1);
  const firstAvatar = allAvatars[0];
  const restAvatars = allAvatars.slice(1);

  // 多人選取集合
  const [activeUserIds, setActiveUserIds] = useState(new Set());
  const toggleUser = (uid) => {
    setActiveUserIds(prev => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });
  };
  const clearUsers = () => setActiveUserIds(new Set());
  // 向後相容（若子元件仍需要單一 id）
  const activeUserId = [...activeUserIds][0] || null;

  /* ───────── 新增景點 Modal ───────── */
  const [modalOpen, setModalOpen] = useState(false);
  const [originAttractions, setOriginAttractions] = useState([]); // 伺服器原始資料
  const [attractions, setAttractions] = useState([]);             // 篩選後顯示
  const [selected, setSelected] = useState(new Set());            // Modal 中勾選
  const [picked, setPicked] = useState([]);                       // 已挑選到首頁
  const [manualMode, setManualMode] = useState(false);
  const [form, setForm] = useState({
    name_zh:'', name_en:'', category:'', address:'', budget:'', photo:'',
    comment:'',   // optional
    link:''       // optional
  });
  const [search, setSearch] = useState('');
  // Modal 類別（多選）
  const CATEGORY_OPTIONS = [
    'History & Religion',
    'Scenic Spots',
    'Art & Museums',
    'Transport Rides',
  ];
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [selectedCats, setSelectedCats] = useState(new Set()); // 多選
  const searchWrapRef = useRef(null); // 關閉下拉用

  /* ───────── Treemap 資料 ───────── */
  const [d3Data, setD3Data] = useState([]);         // 目前未使用（保留）
  const [selectedItems, setSelectedItems] = useState([]); // 右側卡片顯示
  const [fullD3Data, setFullD3Data] = useState([]);

  /* ───────── 新增評論 ───────── */
  const [commentsMap, setCommentsMap] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentTarget, setCommentTarget] = useState(null);
  const [commentText, setCommentText]     = useState('');

  /* ───────── 新增連結 ───────── */
  const [linksMap, setLinksMap] = useState({});
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkTarget, setLinkTarget] = useState(null);
  const [linkText, setLinkText] = useState('');

  /* ───────── 加速階段(到時候刪掉) ───────── */
  const [onlyPicked, setOnlyPicked] = useState(false);

  /* ───────── 選擇完畢彈窗 ───────── */
  const [doneModalOpen, setDoneModalOpen] = useState(false);
  const closeDoneModal = () => {
    setDoneModalOpen(false);
    setOnlyPicked(false);
  };

  /* ───────── 類別色卡（Legend） ───────── */
  const [showLegend, setShowLegend] = useState(false);
  const LEGEND_CATEGORIES = [
    'Culture & Heritage',
    'Scenic Spots',
    'Transport Rides',
    'Discovery Spaces',
    'Public Squares',
  ];

  useEffect(() => {
    if (!doneModalOpen) return;
    const onKey = (e) => { if (e.key === 'Escape' || e.key === 'Enter') closeDoneModal(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [doneModalOpen]);

  /* ───────── 讀取旅程標題 ───────── */
  useEffect(() => {
    if (!tripId) { setTripTitle('無法讀取旅程名稱'); return; }
    axios.get(`http://localhost:3001/api/trips/${tripId}`)
      .then(res => setTripTitle(res.data.title))
      .catch(()  => setTripTitle('讀取失敗'));
  }, [tripId]);

  /* ───────── 倒數計時 ───────── */
  useEffect(() => {
    if (secLeft <= 0) return;
    const id = setInterval(() => setSecLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [secLeft]);

  /* ───────── Chipbar 全部分類(下拉式選單) ───────── */
  const CHIP_CATEGORY_OPTIONS = [
    'History & Religion',
    'Scenic Spots',
    'Art & Museums',
    'Transport Rides',
  ];
  const chipLabel = useMemo(() => {
    if (categoryFilters.has('ALL')) return '全部分類';
    const names = [...categoryFilters].filter(c => c !== 'ALL');
    return names.length ? names.join('、') : '全部分類';
  }, [categoryFilters]);

  /* ───────── 新增景點 | 取得清單 ───────── */
  const openModal = async () => {
    fetchCtrl.current?.abort?.();
    fetchCtrl.current = new AbortController();
    const { signal } = fetchCtrl.current;

    setSelected(new Set());
    setSearch('');
    setManualMode(false);
    setModalOpen(true);
    setSelectedCats(new Set());
    setCatMenuOpen(false);
    setAttractions([]);
    setOriginAttractions([]);

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

  /* ───────── 手動新增景點 ───────── */
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

      // 評論
      if (form.comment?.trim()) {
        const { data: cRes } = await axios.post('http://localhost:3001/api/comments', {
          attraction_id: data.a_id, user_id: 1, content: form.comment.trim()
        });
        if (cRes?.success) {
          setCommentsMap(prev => {
            const list = prev[data.a_id] || [];
            return { ...prev, [data.a_id]: [...list, {
              id: cRes.id, user_id: 1, content: form.comment.trim(), created_at: cRes.created_at
            }]};
          });
        }
      }

      // 連結（注意後端欄位名 xontent）
      if (form.link?.trim()) {
        const { data: lRes } = await axios.post('http://localhost:3001/api/links', {
          attraction_id: data.a_id, user_id: 1, xontent: form.link.trim()
        });
        if (lRes?.success) {
          setLinksMap(prev => {
            const list = prev[data.a_id] || [];
            return { ...prev, [data.a_id]: [...list, {
              id: lRes.id, user_id: 1, xontent: form.link.trim(), created_at: lRes.created_at
            }]};
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

  /* ───────── 新增景點 | 查詢/過濾 ───────── */
  useEffect(() => {
    if (!modalOpen || manualMode) return;

    const kw = search.trim().toLowerCase();
    const norm = (s) => (s || '').trim().toLowerCase();

    let filtered = originAttractions;

    // ① 類別多選
    if (selectedCats.size > 0) {
      filtered = filtered.filter(a => selectedCats.has(norm(a.category)));
    }
    // ② 關鍵字
    if (kw) {
      filtered = filtered.filter(a =>
        (a.name_zh || '').toLowerCase().includes(kw) ||
        (a.name_en || '').toLowerCase().includes(kw) ||
        (a.city    || '').toLowerCase().includes(kw)
      );
    }

    setAttractions(filtered);
    setSelected(prev => new Set(
      [...prev].filter(id => filtered.some(a => a.a_id === id))
    ));
  }, [search, modalOpen, manualMode, originAttractions, selectedCats]);

  /* ───────── 新增景點 | 景點挑選 ───────── */
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
  const handleInput = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const goHome      = () => { setModalOpen(false); setManualMode(false); };
  const toggleSidebar = () => setCollapsed((c) => !c);

  /* ───────── Treemap | 從後端組資料 ───────── */
  useEffect(() => {
    if (!country) return;
    const ctrl = new AbortController();
    (async () => {
      try {
        const { data: attrs } = await axios.get(
          'http://localhost:3001/api/attractions',
          { params: { country: COUNTRY_MAP[country] || country }, signal: ctrl.signal }
        );

        const { data: stats } = await axios.get(
          'http://localhost:3001/api/d3',
          { signal: ctrl.signal }
        );

        const byId = new Map(stats.map(r => [r.a_id, r]));
        const merged = attrs.map(a => {
          const s = byId.get(a.a_id) || {};
          let who_like = Array.isArray(s.who_like) ? s.who_like : JSON.parse(s.who_like||'[]');
          let who_love = Array.isArray(s.who_love) ? s.who_love : JSON.parse(s.who_love||'[]');

          return {
            t_id:      s.t_id ?? tripId,
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
  }, [country, tripId]);

  useEffect(() => {
    setSelectedItems([]);
  }, [fullD3Data, picked, categoryFilters]);

  const treemapData = useMemo(() => {
    const pickedIds = new Set(picked.map(p => p.a_id));
    let list = fullD3Data.filter(d => pickedIds.has(d.a_id));
    if (!(categoryFilters.has('ALL'))) {
      list = list.filter(d => categoryFilters.has((d.category || '').trim()));
    }
    return list;
  }, [fullD3Data, picked, categoryFilters]);

  const handleTreemapSelect = React.useCallback((item) => {
    setSelectedItems([item]);
  }, []);

  /* ───────── Sidebar資訊顯示（排序/過濾） ───────── */
  const displayData = useMemo(() => {
    const base = selectedItems;
    let list = categoryFilters.has('ALL')
      ? [...base]
      : base.filter(x => categoryFilters.has((x.category || '').trim()));

    const votes = (x) => (x.vote_like || 0) + (x.vote_love || 0);
    const pref  = (x) => (x.vote_love || 0) * 2 + (x.vote_like || 0);
    if (sortKey === 'votes') list.sort((a, b) => votes(b) - votes(a) || (a.name_zh || '').localeCompare(b.name_zh || ''));
    if (sortKey === 'pref')  list.sort((a, b) => pref(b)  - pref(a)  || (a.name_zh || '').localeCompare(b.name_zh || ''));
    return list;
  }, [selectedItems, sortKey, categoryFilters]);

  const removeSidebarItem = (a_id) => {
    setSelectedItems(prev => prev.filter(p => p.a_id !== a_id));
  };

  /* ───────── 新增評論 ───────── */
  const openCommentModal = (a_id) => {
    setCommentTarget(a_id);
    setCommentText('');
    setCommentModalOpen(true);
  };

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

  /* ───────── 新增連結 ───────── */
  useEffect(() => {
    axios.get('http://localhost:3001/api/links')
      .then(({ data }) => {
        const map = {};
        data.forEach(l => {
          if (!map[l.attraction_id]) map[l.attraction_id] = [];
          map[l.attraction_id].push(l);
        });
        setLinksMap(map);
      })
      .catch(console.error);
  }, []);

  const openLinkModal = (a_id) => {
    setLinkTarget(a_id);
    setLinkText('');
    setLinkModalOpen(true);
  };
  const closeLinkModal = () => setLinkModalOpen(false);

  const submitLink = async () => {
    if (!linkText.trim()) return;
    try {
      const { data } = await axios.post('http://localhost:3001/api/links', {
        attraction_id: linkTarget,
        user_id: 1,
        xontent: linkText.trim()
      });
      if (data.success) {
        setLinksMap(prev => {
          const prevList = prev[linkTarget] || [];
          return {
            ...prev,
            [linkTarget]: [...prevList, {
              id: data.id,
              user_id: 1,
              xontent: linkText.trim(),
              created_at: data.created_at
            }]
          };
        });
        setLinkModalOpen(false);
        toast.success('已新增連結');
      } else throw new Error(data.error);
    } catch (err) {
      console.error(err);
      toast.error(err.message || '新增連結失敗');
    }
  };

  /* ───────── 下拉選單(分類) ───────── */
  useEffect(() => {
    const onDocClick = (e) => {
      if (!catBtnRef.current) return;
      if (!catBtnRef.current.contains(e.target)) setCatOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!searchWrapRef.current) return;
      if (!searchWrapRef.current.contains(e.target)) setCatMenuOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  /* ───────── Render ───────── */
  return (
    <div className="page">
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
          <div
            className={`chip dropdown ${catOpen ? 'open' : ''}`}
            ref={catBtnRef}
            onClick={() => setCatOpen((o) => !o)}
          >
            {chipLabel}
            <span className="caret">▾</span>
            {catOpen && (
              <div
                className="dropdown-menu categories"
                role="menu"
                onClick={(e) => e.stopPropagation()}
              >
                {/* 分類列表 */}
                <div className="cat-list">
                  {['ALL', ...CHIP_CATEGORY_OPTIONS].map((opt) => {
                    const isSelected = categoryFilters.has(opt);
                    const handleToggle = (e) => {
                      e.stopPropagation();
                      setCategoryFilters((prev) => {
                        const next = new Set(prev);
                        if (opt === 'ALL') {
                          return new Set(['ALL']);
                        }
                        if (next.has('ALL')) next.delete('ALL');
                        if (isSelected) {
                          next.delete(opt);
                          if (next.size === 0) next.add('ALL');
                        } else {
                          next.add(opt);
                        }
                        return next;
                      });
                    };
                    return (
                      <label
                        key={opt}
                        className={`cat-item ${isSelected ? 'checked' : ''}`}
                        onClick={handleToggle}
                      >
                        <input type="checkbox" checked={isSelected} readOnly />
                        <span>{opt === 'ALL' ? '全部分類' : opt}</span>
                      </label>
                    );
                  })}
                </div>
                {/* 動作按鈕區 */}
                <div className="menu-actions">
                  <button
                    type="button"
                    className="btn-clean"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCategoryFilters(new Set(['ALL']));
                    }}
                  >
                    清除
                  </button>
                  <button
                    type="button"
                    className="btn-done"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCatOpen(false);
                    }}
                  >
                    完成
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="button"
            onClick={openModal}
            aria-haspopup="dialog"
            aria-controls="add-spot-modal"
            aria-expanded={modalOpen}
          >
            <span className="button__text">新增景點</span>
            <span className="button__icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </span>
          </button>

          <div id="fileLoadIndicator">
            <button
              id="id_block_refresh"
              className={`block-refresh ${refreshing ? 'is-spinning' : ''}`}
              onClick={handleRefresh}
              aria-label="更新"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                <polyline points="21 3 21 9 15 9" />
              </svg>
            </button>
          </div>
        </div>

        {/* 3) Sidebar */}
        <aside
          id="sidebar"
          ref={sidebarRef}
          className={collapsed ? "collapsed" : ""}
        >
          <div className="sidebar-inner">
            {/* 頭像區（多選 + 未選變暗） */}
            <div className="avatar-row">
              {/* 1. 大頭貼 ("我") */}
              {(() => {
                const uid = `${String(firstAvatar).repeat(3)}`;   // '111'
                return (
                  <div
                    className={`avatar-large ${activeUserIds.size>0 ? (activeUserIds.has(uid) ? 'is-selected' : 'is-dim') : ''}`}
                    id={uid}
                    onClick={() => toggleUser(uid)}
                    aria-pressed={activeUserIds.has(uid)}
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

              {/* 2. 小頭貼（其餘使用者） */}
              <div className="avatar-strip-wrap" ref={wrapRef}>
                <div className="avatar-strip" ref={stripRef}>
                  {restAvatars.map(i => {
                    const uid = `${String(i).repeat(3)}`;
                    return (
                      <div
                        key={i}
                        className={`avatar ${activeUserIds.size>0 ? (activeUserIds.has(uid) ? 'is-selected' : 'is-dim') : ''}`}
                        id={uid}
                        onClick={() => toggleUser(uid)}
                        aria-pressed={activeUserIds.has(uid)}
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

              <div className="avatar-tools">
                <span className="pill">已選 {activeUserIds.size} 人</span>
                <button type="button" className="btn-link small" onClick={clearUsers} disabled={activeUserIds.size===0}>
                  清除
                </button>
              </div>
            </div>

            {/* 右側推薦/資訊區 */}
            <div className="rec-list">
              {showLegend ? (
                <div className="legend-panel" role="list" aria-label="類別與顏色對照">
                  {LEGEND_CATEGORIES.map((name) => {
                    const { startColor, endColor } = neonStops(name);
                    const bg = `linear-gradient(90deg, ${startColor}, ${endColor})`;
                    return (
                      <div className="legend-item" role="listitem" key={name}>
                        <span className="legend-swatch" style={{ background: bg }} aria-hidden="true" />
                        <div className="legend-meta">
                          <div className="legend-name">{name}</div>
                          <div className="legend-hex">{startColor} → {endColor}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <>
                  {displayData.map((it) => {
                    const cmts = commentsMap[it.a_id] || [];
                    const isExpanded = !!expandedComments[it.a_id];

                    const toggleExpand = () => {
                      setExpandedComments(prev => ({
                        ...prev,
                        [it.a_id]: !isExpanded
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

                          {/* 標題 + 地址 + 照片 */}
                          <div className="rec-head">
                            <div className="rec-title">
                              <span className="zh">{it.name_zh}</span><span className="sep"> | </span><span className="en">{it.name_en}</span>
                            </div>
                            <div className="rec-addr">📍 {it.address || '地址未提供'}</div>
                            <div className="rec-photo">
                              <img src={it.photo || `https://picsum.photos/seed/p${it.a_id}/132/88`} alt={it.name_zh} />
                            </div>
                          </div>

                          {/* 留言 */}
                          <div className="rec-comment">
                            <div className="rec-sec-head">
                              <div className="rec-sec-title">💬 評論</div>
                              <button className="icon-btn add-btn tiny" onClick={() => openCommentModal(it.a_id)}>
                                <div className="add-icon"></div>
                                <div className="btn-txt">新增評論</div>
                              </button>
                            </div>
                            <div className="cmt">
                              {cmts.map(c => (
                                <div key={c.id}>
                                  <div className="name">{c.user_id || '匿名'}</div>
                                  <div className="txt">{c.content}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 連結 */}
                          <div className="rec-comment">
                            <div className="rec-sec-head">
                              <div className="rec-sec-title">🔗 連結</div>
                              <button className="icon-btn add-btn tiny" onClick={() => openLinkModal(it.a_id)}>
                                <div className="add-icon"></div>
                                <div className="btn-txt">新增連結</div>
                              </button>
                            </div>
                            <div className="cmt">
                              {(linksMap[it.a_id] || []).map(l => (
                                <div key={l.id}>
                                  <div className="name">{l.user_id}</div>
                                  <div className="txt">
                                    <a href={l.xontent} target="_blank" rel="noreferrer">{l.xontent}</a>
                                  </div>
                                </div>
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
              <button
                type="button"
                className="btn-primary small"
                onClick={() => setShowLegend(v => !v)}
                aria-pressed={showLegend}
              >
                {showLegend ? '顯示景點資訊' : '類別顏色對照表'}
              </button>

              <button
                type="button"
                className="btn-primary small"
                onClick={() => {
                  setOnlyPicked(true);
                  setDoneModalOpen(true);
                }}
              >
                選擇完畢
              </button>
            </div>
          </div>
        </aside>

        {/* Treemap */}
        <section className="board" id="treemap-container">
          {picked.length === 0 ? (
            <div className="placeholder">請先按「新增景點」並確認您的選擇</div>
          ) : treemapData.length === 0 ? (
            <div className="placeholder">此分類目前沒有已挑選的景點</div>
          ) : (
            <Treemap
              key={[
                treemapData.map(d => d.a_id).join('_'),
                [...activeUserIds].sort().join(','),
                sortKey,
                [...categoryFilters].sort().join('|')
              ].join('-')}
              data={treemapData}
              onSelect={handleTreemapSelect}
              activeUserId={activeUserId}                 /* 相容單選 */
              activeUserIds={[...activeUserIds]}          /* 多選 */
              sortKey={sortKey}
              selectedIds={selectedItems.map(x => x.a_id)}
              onRefresh={handleRefresh}
            />
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
                  <label>💬 評論
                    <textarea name="comment" value={form.comment} onChange={handleInput} />
                  </label>
                  <label>🔗 相關連結
                    <input name="link" type="url" placeholder="https://…" value={form.link} onChange={handleInput} />
                  </label>
                </div>

                <div className="btn-group">
                  <button className="hand-btn" onClick={() => setManualMode(false)}>← 返回</button>
                  <button className="home-btn" onClick={goHome}>首頁</button>
                  <button className="confirm-btn" onClick={submitManual}>送出</button>
                </div>
              </>
            ) : (
              <>
                {/* 搜尋列（同時作為下拉容器） */}
                <div className="search-bar with-dropdown" ref={searchWrapRef}>
                  <input
                    type="text"
                    placeholder="輸入關鍵字搜尋…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setCatMenuOpen(true)}
                    onClick={() => setCatMenuOpen(true)}
                  />

                  {catMenuOpen && (
                    <div className="dropdown categories" role="menu" aria-label="類別過濾">
                      <div className="cat-list">
                        {CATEGORY_OPTIONS.map(opt => {
                          const label = opt;                      // 顯示用
                          const key = opt.toLowerCase();         // 內部比對用（小寫）
                          const checked = selectedCats.has(key);
                          const toggle = () => setSelectedCats(prev => {
                            const next = new Set(prev);
                            checked ? next.delete(key) : next.add(key);
                            return next;
                          });
                          return (
                            <label key={opt} className={`cat-item ${checked ? 'checked' : ''}`}>
                              <input type="checkbox" checked={checked} onChange={toggle} />
                              <span>{label}</span>
                            </label>
                          );
                        })}
                      </div>
                      <div className="menu-actions">
                        <button type="button" className="btn-clean" onClick={() => setSelectedCats(new Set())}>清除</button>
                        <button type="button" className="btn-done" onClick={() => setCatMenuOpen(false)}>完成</button>
                      </div>
                    </div>
                  )}
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

      {/* ===== 新增連結 Modal ===== */}
      {linkModalOpen && (
        <div className="modal-mask" onClick={closeLinkModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">新增連結</h3>
            <div className="comment-form">
              <input
                type="url"
                placeholder="輸入連結網址…"
                value={linkText}
                onChange={e => setLinkText(e.target.value)}
                style={{ width: '100%', padding: '8px', fontSize: '14px' }}
              />
            </div>
            <div className="btn-group">
              <button className="hand-btn" onClick={closeLinkModal}>取消</button>
              <button className="confirm-btn" onClick={submitLink}>送出</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 選擇完畢 Modal ===== */}
      {doneModalOpen && (
        <div className="modal-mask" onClick={closeDoneModal}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">景點選擇完畢</h3>
            <p style={{ margin: '0 0 8px' }}>
              時間倒數計時 ⌛<b>{hh}:{mm}:{ss}</b>
            </p>
            <p style={{ margin: '0 0 16px' }}>請稍候，等待其他團員完成景點選擇。</p>
            <div className="btn-con">
              <button className="confirm-btn" onClick={closeDoneModal}>繼續選擇景點</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
