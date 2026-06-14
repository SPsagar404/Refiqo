import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Loader } from '@/components/ui';
import { qk } from '@/lib/queryClient';
import { AppStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/stores/authStore';
import { colors, radii, spacing, typography } from '@/theme';
import { ChatMessage } from '@/types/models';
import { fetchMessages, markConversationRead, sendMessage } from './chatApi';

type Props = NativeStackScreenProps<AppStackParamList, 'Chat'>;

export function ChatScreen({ route }: Props) {
  const { conversationId } = route.params;
  const qc = useQueryClient();
  const myId = useAuthStore((s) => s.user?.id);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const { data, isLoading } = useQuery({
    queryKey: qk.messages(conversationId),
    queryFn: () => fetchMessages(conversationId),
    refetchInterval: 4000, // local polling stands in for Supabase Realtime
  });

  useEffect(() => {
    markConversationRead(conversationId).then(() =>
      qc.invalidateQueries({ queryKey: qk.conversations }),
    );
  }, [conversationId, qc]);

  const send = useMutation({
    mutationFn: () => sendMessage(conversationId, { body: text.trim(), type: 'TEXT' }),
    onSuccess: () => {
      setText('');
      qc.invalidateQueries({ queryKey: qk.messages(conversationId) });
    },
  });

  const messages = data?.data ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {isLoading ? (
          <Loader />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => {
              const mine = item.senderId === myId;
              return (
                <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}>
                  <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                    <Text style={[styles.msg, mine && styles.msgMine]}>{item.body}</Text>
                    <View style={styles.metaRow}>
                      <Text style={[styles.time, mine && styles.timeMine]}>
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      {mine && (
                        <Ionicons
                          name={item.readAt ? 'checkmark-done' : 'checkmark'}
                          size={13}
                          color={item.readAt ? colors.info : 'rgba(255,255,255,0.7)'}
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}

        <View style={styles.inputBar}>
          <Pressable style={styles.attach} hitSlop={8}>
            <Ionicons name="add" size={22} color={colors.textMuted} />
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="Message…"
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
          />
          <Pressable
            style={[styles.sendBtn, !text.trim() && styles.sendDisabled]}
            disabled={!text.trim() || send.isPending}
            onPress={() => send.mutate()}
          >
            <Ionicons name="send" size={18} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  list: { padding: spacing.lg },
  bubbleRow: { marginBottom: spacing.sm, flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: radii.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.surfaceAlt, borderBottomLeftRadius: 4 },
  msg: { ...typography.body, color: colors.text },
  msgMine: { color: colors.white },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 2 },
  time: { ...typography.caption, color: colors.textMuted },
  timeMine: { color: 'rgba(255,255,255,0.7)' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  attach: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1,
    color: colors.text,
    ...typography.body,
    maxHeight: 120,
    backgroundColor: colors.inputBg,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.4 },
});
