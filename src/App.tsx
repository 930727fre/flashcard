// src/App.tsx
import { MantineProvider, Box } from '@mantine/core'; // 引入 Box
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Notifications } from '@mantine/notifications';
import { useStore } from './store';

// 樣式導入
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

// 頁面導入
import SettingsPage from './pages/SettingsPage';
import DashboardPage from './pages/DashboardPage';
import ReviewPage from './pages/ReviewPage';
import BatchAddPage from './pages/BatchAddPage';

function App() {
  const { gasUrl } = useStore();

  return (
    <MantineProvider defaultColorScheme="dark"> {/* 1. 強制深色模式 */}
      <Notifications />
      
      {/* 2. 使用 Box 撐開全螢幕背景 */}
      <Box 
        style={{ 
          backgroundColor: '#0a0c14', // 與 Dashboard 搭配的極深色背景
          minHeight: '100vh', 
          color: '#e8eaf0' 
        }}
      >
        <HashRouter>
          <Routes>
            <Route 
              path="/" 
              element={gasUrl ? <DashboardPage /> : <Navigate to="/settings" />} 
            />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/batch-add" element={<BatchAddPage />} />
          </Routes>
        </HashRouter>
      </Box>
    </MantineProvider>
  );
}

export default App;