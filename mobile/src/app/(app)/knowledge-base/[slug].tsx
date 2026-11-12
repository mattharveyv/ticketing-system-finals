import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorMessage, Page, PrimaryButton } from '../../../components/ui';
import { useAuth } from '../../../lib/auth';
import { api, HelpArticleDetails } from '../../../lib/api';
import { colors } from '../../../theme';

export default function HelpArticleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const [article, setArticle] = useState<HelpArticleDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadArticle() {
      if (!token || !slug) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        setArticle(await api.helpArticle(token, slug));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unable to load this article.');
      } finally {
        setLoading(false);
      }
    }

    void loadArticle();
  }, [slug, token]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.green} size="large" />
      </View>
    );
  }

  return (
    <Page>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}>
        <Pressable
          accessibilityLabel="Back to the help center"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.back}>‹  Help center</Text>
        </Pressable>
        {error ? <ErrorMessage message={error} /> : null}
        {article ? (
          <>
            <Text style={styles.eyebrow}>
              {article.category.toUpperCase()} · HELP ARTICLE
            </Text>
            <Text style={styles.title}>{article.title}</Text>
            <Text style={styles.byline}>MSEUF Support Team · Updated {article.updated}</Text>

            <View style={styles.articleCard}>
              <Text style={styles.intro}>{article.summary}</Text>
              {article.sections.map((section) => (
                <View key={section.title} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  {section.paragraphs?.map((paragraph, index) => (
                    <Text key={`${section.title}-${index}`} style={styles.paragraph}>
                      {paragraph}
                    </Text>
                  ))}
                  {section.steps?.map((step, index) => (
                    <View key={`${section.title}-${index}`} style={styles.step}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.paragraph}>{step}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>

            <View style={styles.helpCard}>
              <Text style={styles.helpTitle}>Still need a hand?</Text>
              <Text style={styles.paragraph}>
                Our support team can help with the next step.
              </Text>
              <Link href="/(app)/new-ticket" style={styles.link}>
                Create a ticket →
              </Link>
            </View>
          </>
        ) : null}
        {error ? (
          <PrimaryButton title="Back to help center" onPress={() => router.replace('/(app)/knowledge-base')} />
        ) : null}
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    gap: 14,
    padding: 20,
    paddingBottom: 30,
  },
  back: {
    color: colors.green,
    fontSize: 14,
    fontWeight: '800',
  },
  backButton: {
    minHeight: 44,
    justifyContent: 'center',
  },
  eyebrow: {
    marginTop: 6,
    color: colors.green,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 32,
  },
  byline: {
    color: colors.muted,
    fontSize: 12,
  },
  articleCard: {
    gap: 18,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    backgroundColor: colors.white,
    padding: 18,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.035,
    shadowRadius: 12,
    elevation: 1,
  },
  intro: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 23,
  },
  section: {
    gap: 9,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
  },
  paragraph: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    lineHeight: 22,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumber: {
    width: 23,
    height: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.mint,
  },
  stepNumberText: {
    color: colors.greenDark,
    fontSize: 11,
    fontWeight: '800',
  },
  helpCard: {
    gap: 9,
    borderRadius: 18,
    backgroundColor: colors.nav,
    padding: 17,
  },
  helpTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  link: {
    alignSelf: 'flex-start',
    color: colors.burgundyText,
    fontSize: 14,
    fontWeight: '800',
  },
});
