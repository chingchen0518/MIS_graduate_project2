import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TARGET_ID = 1;

function pickTripName(payload, id) {
    const arr = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.trips)
        ? payload.trips
        : [payload];

    const hit = arr.find(x => Number(x?.t_id) === Number(id));
    return hit ? (hit.title ?? hit.name ?? hit.name_zh ?? null) : null;
    }

    export default function TripNameProbe() {
    const [title, setTitle] = useState('');
    const [raw, setRaw] = useState(null);
    const [err, setErr] = useState('');

    useEffect(() => {
        let mounted = true;
        axios.get('http://localhost:3001/api/tripID')
        .then(({ data }) => {
            if (!mounted) return;
            setRaw(data);
            const t = pickTripName(data, TARGET_ID);
            setTitle(t || '');
        })
        .catch(e => {
            if (!mounted) return;
            setErr(e?.message || String(e));
        });
        return () => { mounted = false; };
    }, []);

    if (err) return <div style={{ color: 'crimson' }}>讀取失敗：{err}</div>;

    return (
        <div style={{ padding: 12 }}>
        <div style={{ fontSize: 18 }}>
            {title ? title : '（找不到）'}
        </div>

        <details style={{ marginTop: 12 }}>
            <summary>查看原始回應</summary>
            <pre style={{ whiteSpace: 'pre-wrap', background: '#f7f7f7', padding: 8, borderRadius: 8 }}>
            {raw ? JSON.stringify(raw, null, 2) : '載入中…'}
            </pre>
        </details>
        </div>
    );
}
