import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('user'); // 清除登入資料
    navigate('/login');              // 自動導向回登入頁
  }, [navigate]);

  return null; // 或顯示「正在登出中...」
};

export default Logout;
