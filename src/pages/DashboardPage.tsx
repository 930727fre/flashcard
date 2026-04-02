// ./src/pages/DashboardPage.tsx
import { useEffect, useMemo } from 'react';
import {
  Container, Title, Text, Paper, Group, Stack,
  Button, ThemeIcon, Skeleton, Box, Badge, Transition, Center, Progress
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useStore, computeQueue } from '../store';
import {
  IconFlame, IconCards, IconPlus,
  IconPlayerPlay, IconUpload, IconLogout, IconCheck
} from '@tabler/icons-react';

const PHASE_CONFIG = {
  done: {
    borderColor: '#1e5c36', bg: '#0e1f16',
    iconColor: 'green', tagColor: '#4dbb7a', tag: 'All Clear',
    icon: <IconCheck size={22} />,
    badge: { color: '#1a3d28', text: '#4dbb7a', border: '#1e5c36', label: 'All Clear' },
    button: { gradient: { from: '#1a3d28', to: '#2a5c3e' }, label: '今日任務已達成！' },
    disabled: true,
  },
  review: {
    borderColor: '#1f3e70', bg: '#101a2e',
    iconColor: 'blue', tagColor: '#4a8fff', tag: 'Current Task: Review',
    icon: <IconCards size={22} />,
    badge: { color: '#122040', text: '#4a8fff', border: '#1f3e70', label: 'Phase 1' },
    button: { gradient: { from: '#1a4fc7', to: '#2d7aff' }, label: null },
    disabled: false,
  },
  learning: {
    borderColor: '#7a5e10', bg: '#22190a',
    iconColor: 'yellow', tagColor: '#f5c542', tag: "Today's New Cards",
    icon: <IconPlus size={22} />,
    badge: { color: '#2a2008', text: '#f5c542', border: '#7a5e10', label: 'Phase 2' },
    button: { gradient: { from: '#b87b00', to: '#f0a500' }, label: null },
    disabled: false,
  },
} as const;

export default function DashboardPage() {
  const { cards, settings, isLoading, fetchEverything, logout } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEverything();
  }, [fetchEverything]);

  const stats = useMemo(() => {
    const newCount = Number(settings?.daily_new_count || 0);
    const queue = computeQueue(cards, settings);
    const phase = queue.length === 0 ? 'done'
      : queue.some(c => Number(c.state) !== 0) ? 'review'
      : 'learning';
    return { queueSize: queue.length, newCount, phase } as const;
  }, [cards, settings]);

  const isDataReady = !isLoading && settings !== null;

  if (!isDataReady) {
      return (
        <Center h="100vh" bg="#0a0c14"> 
          <Container size="sm" maw={480} w="100%" px="md">
            <Stack gap="md">
              {/* 連勝卡片 Skeleton */}
              <Skeleton height={120} radius={14} animate />
              
              {/* 狀態卡片 Skeleton */}
              <Skeleton height={90} radius={14} animate />
              
              {/* 主按鈕 Skeleton */}
              <Skeleton height={56} radius={14} animate />
              
              {/* 功能按鈕 Skeleton */}
              <Group grow gap="sm">
                <Skeleton height={48} radius={8} animate />
                <Skeleton height={48} radius={8} animate />
              </Group>

              <Center mt="md">
                <Stack gap={4} align="center">
                  <Text c="dimmed" size="xs" fw={700} style={{ letterSpacing: '1.5px' }}>
                    SYNCING WITH GOOGLE SHEETS
                  </Text>
                  <Progress value={100} w={120} size="xs" radius="xl" animated color="blue" />
                </Stack>
              </Center>
            </Stack>
          </Container>
        </Center>
      );
    }

  const cfg = PHASE_CONFIG[stats.phase];

  const phaseTitle = stats.phase === 'done'
    ? <Text fw={600} size="lg" c="#e8eaf0">今日沒有待辦任務 🎉</Text>
    : stats.phase === 'review'
    ? <Text fw={600} size="lg" c="#e8eaf0">剩餘 <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20 }}>{stats.queueSize}</span> 張待複習</Text>
    : <Text fw={600} size="lg" c="#e8eaf0">剩下 <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20 }}>{stats.queueSize}</span> 張新單字要背</Text>;

  const phaseSubtitle = stats.phase === 'done'
    ? <Text size="sm" c="dimmed">完成所有複習，或前往批量匯入新單字。</Text>
    : stats.phase === 'learning'
    ? <Text size="sm" c="dimmed">今日已開 +{stats.newCount} 張新卡</Text>
    : null;

  const buttonLabel = cfg.button.label
    ?? `開始${stats.phase === 'learning' ? '學習' : '複習'} (${stats.queueSize} 張)`;

return (
    <Transition mounted={isDataReady} transition="fade" duration={400}>
      {(styles) => (
        <div style={{ 
          ...styles, 
          // --- 核心改動：全螢幕置中佈局 ---
          minHeight: '100vh', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: '#0a0c14' // 確保背景色一致
        }}>
          {/* 移除 Container 的 py="xl"，改用 w="100%" 配合置中 */}
          <Container size="sm" maw={480} px="md" w="100%">
            <Stack gap="md">

              {/* 連勝卡片 */}
              <Paper radius={14} p="xl"
                style={{ 
                  background: 'linear-gradient(135deg, #2a1f14 0%, #181c27 100%)', 
                  border: '1px solid #a85a2a',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)' 
                }}>
                <Group gap="xl" wrap="nowrap">
                  <IconFlame size={52} color="#ff9151" fill="#ff6b1a" style={{ flexShrink: 0 }} />
                  <Box>
                    <Text size="xs" fw={600} c="#ff9151" tt="uppercase" style={{ letterSpacing: '1.5px' }}>
                      Current Streak
                    </Text>
                    <Title order={1} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 38, color: '#ffb27a', lineHeight: 1.1 }}>
                      {settings?.streak_count || 0}{' '}
                      <Text span size="lg" c="#ff9151" fw={400}>Days</Text>
                    </Title>
                  </Box>
                </Group>
              </Paper>

              {/* 狀態卡片 */}
              <Paper radius={14} p="lg"
                style={{ 
                  background: cfg.bg, 
                  border: `1px solid ${cfg.borderColor}`,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)' 
                }}>
                <Group justify="space-between" wrap="nowrap" gap="sm">
                  <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
                    <ThemeIcon size={44} radius={10} color={cfg.iconColor} variant="light" style={{ flexShrink: 0 }}>
                      {cfg.icon}
                    </ThemeIcon>
                    <Box style={{ minWidth: 0 }}>
                      <Text size="xs" fw={600} tt="uppercase" style={{ letterSpacing: '1.2px', color: cfg.tagColor, marginBottom: 3 }}>
                        {cfg.tag}
                      </Text>
                      {phaseTitle}
                      {phaseSubtitle}
                    </Box>
                  </Group>
                  <Badge style={{
                    background: cfg.badge.color,
                    color: cfg.badge.text,
                    border: `1px solid ${cfg.badge.border}`,
                    flexShrink: 0
                  }}>
                    {cfg.badge.label}
                  </Badge>
                </Group>
              </Paper>

              {/* 主按鈕 */}
              <Button
                size="lg"
                radius={14}
                disabled={cfg.disabled}
                onClick={() => !cfg.disabled && navigate('/review')}
                leftSection={<IconPlayerPlay size={20} fill="currentColor" />}
                style={{
                  background: cfg.disabled
                    ? '#1e2335'
                    : `linear-gradient(135deg, ${cfg.button.gradient.from}, ${cfg.button.gradient.to})`,
                  color: stats.phase === 'learning' ? '#1a1200' : '#fff',
                  border: 'none',
                  height: 54,
                  fontSize: 16,
                  fontWeight: 600,
                  boxShadow: cfg.disabled ? 'none' : '0 8px 20px rgba(0,0,0,0.3)'
                }}
              >
                {buttonLabel}
              </Button>

              {/* 功能按鈕 */}
              <Group grow gap="sm">
                <Button
                  variant="outline"
                  size="md"
                  radius={8}
                  leftSection={<IconUpload size={18} />}
                  onClick={() => navigate('/batch-add')}
                  style={{ borderColor: '#2a2f45', color: '#e8eaf0', height: 48 }}
                >
                  批量匯入
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  radius={8}
                  leftSection={<IconLogout size={18} />}
                  onClick={() => { if (window.confirm('確定重置連線？')) logout(); }}
                  style={{ borderColor: '#3d1f1f', color: '#ff7070', height: 48 }}
                >
                  清除連線
                </Button>
              </Group>

            </Stack>
          </Container>
        </div>
      )}
    </Transition>
  );
}