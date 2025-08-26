import { useEffect, useState } from 'react';

function CountdownTimer({ deadline, stage }) {
    const pad = (n) => (n < 10 ? '0' + n : n);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (stage === 5 || !deadline) return <span>00:00:00</span>;
    const diff = Math.max(0, Math.floor((new Date(deadline) - now) / 1000));
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return <span>{pad(h)}:{pad(m)}:{pad(s)}</span>;
}

export default CountdownTimer;