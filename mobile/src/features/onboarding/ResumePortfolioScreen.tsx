import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Chip, Input, Screen } from '@/components/ui';
import { uploadFile } from '@/lib/files';
import { OnboardingStackParamList } from '@/navigation/types';
import { colors, radii, spacing, typography } from '@/theme';
import { PortfolioType } from '@/types/enums';
import { OnboardingHeader } from './OnboardingHeader';
import { saveResumePortfolio } from './onboardingApi';
import { Stepper } from './Stepper';
import { WhyCard } from './WhyCard';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'ResumePortfolio'>;

const PORTFOLIO_TYPES: { type: PortfolioType; label: string }[] = [
  { type: PortfolioType.WEBSITE, label: 'Website' },
  { type: PortfolioType.LINKEDIN, label: 'LinkedIn' },
  { type: PortfolioType.GITHUB, label: 'GitHub' },
  { type: PortfolioType.OTHER, label: 'Other Link' },
];

const TYPE_ICON: Record<PortfolioType, keyof typeof Ionicons.glyphMap> = {
  WEBSITE: 'globe-outline',
  LINKEDIN: 'logo-linkedin',
  GITHUB: 'logo-github',
  OTHER: 'link-outline',
};

const TYPE_LABEL: Record<PortfolioType, string> = {
  WEBSITE: 'Website',
  LINKEDIN: 'LinkedIn',
  GITHUB: 'GitHub',
  OTHER: 'Other Link',
};

const RESUME_TIPS = [
  'Keep it concise — 1–2 pages',
  'Highlight relevant experience',
  'Use clear, professional formatting',
  'Tailor it to the roles you want',
];

export function ResumePortfolioScreen({ navigation }: Props) {
  const [resume, setResume] = useState<{ id?: string; name: string; size: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | undefined>();
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [portfolioType, setPortfolioType] = useState<PortfolioType>(PortfolioType.WEBSITE);
  const [links, setLinks] = useState<{ type: PortfolioType; url: string }[]>([]);
  const [linkError, setLinkError] = useState<string | undefined>();

  // Normalize/validate a URL so it satisfies the backend's url schema.
  const normalizeUrl = (raw: string): string | null => {
    let v = raw.trim();
    if (!v) return null;
    if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
    return /^https?:\/\/[^\s/.]+\.[^\s]+$/i.test(v) ? v : null;
  };

  const addLink = () => {
    const url = normalizeUrl(portfolioUrl);
    if (!url) {
      setLinkError('Enter a valid URL, e.g. https://your-site.com');
      return;
    }
    setLinkError(undefined);
    if (!links.some((l) => l.url.toLowerCase() === url.toLowerCase())) {
      setLinks((prev) => [...prev, { type: portfolioType, url }]);
    }
    setPortfolioUrl('');
  };

  // Include a valid not-yet-added URL so users don't lose it by skipping "Add".
  const collectLinks = () => {
    const pending = normalizeUrl(portfolioUrl);
    return pending && !links.some((l) => l.url.toLowerCase() === pending.toLowerCase())
      ? [...links, { type: portfolioType, url: pending }]
      : links;
  };

  const mutation = useMutation({
    mutationFn: () => saveResumePortfolio({ resumeId: resume?.id, portfolioLinks: collectLinks() }),
    onSuccess: () => navigation.navigate('Preferences'),
  });

  const pickResume = async () => {
    setUploadError(undefined);
    let res: DocumentPicker.DocumentPickerResult;
    try {
      res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
    } catch {
      setUploadError("Couldn't open the file picker. Please try again.");
      return;
    }
    if (res.canceled || !res.assets?.[0]) return;
    const file = res.assets[0];
    if ((file.size ?? 0) > 5 * 1024 * 1024) {
      setUploadError('File is too large. Max size is 5MB.');
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadFile({
        uri: file.uri,
        kind: 'resume',
        fileName: file.name,
        mimeType: file.mimeType ?? 'application/pdf',
        sizeBytes: file.size ?? 0,
      });
      setResume({ id: uploaded.id, name: file.name, size: file.size ?? 0 });
    } catch (e) {
      setUploadError((e as Error).message || 'Upload failed. Please check your connection and try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen scroll>
      <OnboardingHeader
        stepMeta="STEP 3 OF 5 — SHOWCASE YOUR EXPERIENCE AND WORK"
        title="Resume & Portfolio"
        subtitle="Upload your resume (PDF/DOC, max 5MB). Portfolio is optional."
      />
      <Stepper current={3} />

      {resume ? (
        <Card style={styles.resumeCard}>
          <View style={styles.resumeRow}>
            <Ionicons name="document-text" size={24} color={colors.primary} />
            <View style={styles.resumeInfo}>
              <Text style={styles.resumeName} numberOfLines={1}>{resume.name}</Text>
              <Text style={styles.resumeMeta}>{(resume.size / 1024).toFixed(0)} KB · Uploaded</Text>
            </View>
            <Pressable onPress={() => setResume(null)} hitSlop={8}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          </View>
        </Card>
      ) : (
        <Pressable style={styles.dropzone} onPress={pickResume} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={28} color={colors.primary} />
              <Text style={styles.dropTitle}>Upload Your Resume</Text>
              <Text style={styles.dropHint}>Tap to browse — PDF, DOC, DOCX (max 5MB)</Text>
            </>
          )}
        </Pressable>
      )}

      {!!uploadError && (
        <View style={styles.uploadError}>
          <Ionicons name="alert-circle" size={16} color={colors.danger} />
          <Text style={styles.uploadErrorText}>{uploadError}</Text>
        </View>
      )}

      <View style={styles.tipsBox}>
        <Text style={styles.tipsTitle}>Resume Tips</Text>
        {RESUME_TIPS.map((t) => (
          <View key={t} style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={styles.tipText}>{t}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.section}>Add Portfolio (optional)</Text>
      <Text style={styles.hint}>Add one or more links — pick a type, paste the URL, then tap Add.</Text>
      <View style={styles.typeTabs}>
        {PORTFOLIO_TYPES.map((p) => (
          <Chip
            key={p.type}
            label={p.label}
            selected={portfolioType === p.type}
            onPress={() => setPortfolioType(p.type)}
            size="sm"
          />
        ))}
      </View>
      <Input
        icon="link-outline"
        placeholder="https://your-portfolio.com"
        autoCapitalize="none"
        keyboardType="url"
        value={portfolioUrl}
        onChangeText={(t) => {
          setPortfolioUrl(t);
          if (linkError) setLinkError(undefined);
        }}
        onSubmitEditing={addLink}
        returnKeyType="done"
        error={linkError}
      />
      <Button title="Add Link" variant="secondary" icon="add" onPress={addLink} />

      {links.length > 0 && (
        <View style={styles.linkList}>
          {links.map((l, i) => (
            <View key={`${l.url}-${i}`} style={styles.linkRow}>
              <Ionicons name={TYPE_ICON[l.type]} size={18} color={colors.primary} style={styles.linkIcon} />
              <View style={styles.linkInfo}>
                <Text style={styles.linkType}>{TYPE_LABEL[l.type]}</Text>
                <Text style={styles.linkUrl} numberOfLines={1}>{l.url}</Text>
              </View>
              <Pressable onPress={() => setLinks((prev) => prev.filter((_, idx) => idx !== i))} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <WhyCard
        title="Why add Resume & Portfolio?"
        items={[
          { icon: 'shield-checkmark-outline', label: 'Build Trust', text: 'Referrers can verify your experience and skills.' },
          { icon: 'rocket-outline', label: 'Better Opportunities', text: 'Get matched with higher-quality referrals.' },
          { icon: 'trophy-outline', label: 'Showcase Your Work', text: 'Let your projects speak for themselves.' },
          { icon: 'star-outline', label: 'Stand Out', text: 'A complete profile gets noticed first.' },
        ]}
      />

      <Button title="Continue" icon="arrow-forward" loading={mutation.isPending} onPress={() => mutation.mutate()} />
      <View style={{ height: spacing.sm }} />
      <Button title="Skip for now" variant="ghost" onPress={() => navigation.navigate('Preferences')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  dropzone: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: radii.lg,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
  },
  dropTitle: { ...typography.bodyStrong, color: colors.text, marginTop: spacing.md },
  dropHint: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  uploadError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.dangerMuted,
  },
  uploadErrorText: { ...typography.small, color: colors.danger, flex: 1 },
  resumeCard: { marginBottom: spacing.md },
  resumeRow: { flexDirection: 'row', alignItems: 'center' },
  resumeInfo: { flex: 1, marginLeft: spacing.md },
  resumeName: { ...typography.bodyStrong, color: colors.text },
  resumeMeta: { ...typography.caption, color: colors.success, marginTop: 2 },
  section: { ...typography.bodyStrong, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.xs },
  hint: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.md },
  linkList: { marginTop: spacing.md, gap: spacing.sm },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  linkIcon: { marginRight: spacing.sm },
  linkInfo: { flex: 1 },
  linkType: { ...typography.caption, color: colors.textMuted },
  linkUrl: { ...typography.small, color: colors.text },
  tipsBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  tipsTitle: { ...typography.bodyStrong, color: colors.text, marginBottom: spacing.sm },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 3 },
  tipText: { ...typography.small, color: colors.textSecondary },
  typeTabs: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
});
