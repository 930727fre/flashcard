// src/pages/SettingsPage.tsx
import { useState } from 'react';
import { TextInput, Button, Paper, Title, Text, Stack, Container } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useStore } from '../store';
import { gasApi } from '../api'; // 根據你的檔案位置調整，如果是 src/api.ts 就用 '../api'
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const setGasUrl = useStore((state) => state.setGasUrl);
  const navigate = useNavigate();

  const handleConnect = async () => {
    if (!urlInput.includes('script.google.com')) {
      notifications.show({ title: '格式錯誤', message: '請輸入正確的 GAS URL', color: 'red' });
      return;
    }

    setLoading(true);
    try {
      await gasApi.ping(urlInput); // 測試連線
      setGasUrl(urlInput); // 儲存到 Zustand & localStorage
      notifications.show({ title: '連線成功', message: '已同步雲端資料', color: 'green' });
      navigate('/'); // 導向 Dashboard
    } catch (e) {
      notifications.show({ title: '連線失敗', message: '請檢查 GAS 是否正確部署為「所有人」', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xs" mt={100}>
      <Paper p="xl" withBorder shadow="md" radius="md">
        <Stack>
          <Title order={2} ta="center">⚙️ 設定後端連線</Title>
          <Text size="sm" c="dimmed" ta="center">
            請輸入 Google Apps Script 的部署網址以開始使用
          </Text>
          
          <TextInput
            label="GAS Deployment URL"
            placeholder="https://script.google.com/macros/s/.../exec"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
          />

          <Button 
            fullWidth 
            size="md" 
            onClick={handleConnect} 
            loading={loading}
          >
            測試並開始使用
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}