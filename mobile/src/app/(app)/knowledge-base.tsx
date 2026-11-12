import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ErrorMessage, Field, Page, PrimaryButton } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { api, HelpArticle } from '../../lib/api';
import { colors } from '../../theme';

const allCategories = 'All topics';

export default function KnowledgeBaseScreen() {
  const { token } = useAuth();
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(allCategories);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadArticles = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const response = await api.helpArticles(token);
      setArticles(response.data);
      setCategories(response.meta.categories);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load help articles.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void loadArticles();
    }, [loadArticles]),
  );

  const filteredArticles = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return articles.filter((article) => {
      const matchesCategory = category === allCategories || article.category === category;
      const searchableContent =
        `${article.title} ${article.category} ${article.summary}`.toLocaleLowerCase();

      return matchesCategory && (!query || searchableContent.includes(query));
    });
  }, [articles, category, search]);

  return (
    <Page>
      <FlatList
        contentContainerStyle={styles.content}
        data={filteredArticles}
        keyExtractor={(article) => article.slug}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadArticles();
            }}
            tintColor={colors.green}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>SELF-SERVICE, MADE SIMPLE</Text>
            <Text style={styles.title}>Help center</Text>
            <Text style={styles.subtitle}>
              Find a quick answer from guides written by your support team.
            </Text>
            <View style={styles.searchCard}>
              <Text style={styles.searchTitle}>What are you looking for?</Text>
              <Field
                accessibilityLabel="Search help articles"
                autoCapitalize="none"
                label="Search help articles"
                onChangeText={setSearch}
                placeholder="Try password, Wi-Fi, or printer"
                returnKeyType="search"
                value={search}
              />
              <Text style={styles.popularSearches}>
                Popular: VPN · Password · Printer
              </Text>
            </View>
            <Text style={styles.sectionTitle}>Browse by topic</Text>
            <View style={styles.categories}>
              {[allCategories, ...categories].map((item) => {
                const selected = category === item;

                return (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setCategory(item)}
                    style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        selected && styles.categoryTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.articleHeading}>
              <View>
                <Text style={styles.sectionTitle}>Help articles</Text>
                <Text style={styles.articleCount}>
                  {filteredArticles.length} guide{filteredArticles.length === 1 ? '' : 's'}
                </Text>
              </View>
            </View>
            {error ? <ErrorMessage message={error} /> : null}
            {loading ? (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.green} />
                <Text style={styles.articleCount}>Loading help articles…</Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/(app)/knowledge-base/[slug]',
                params: { slug: item.slug },
              })
            }
            style={({ pressed }) => [styles.articleCard, pressed && styles.pressed]}
          >
            <View style={styles.articleIcon}>
              <Text style={styles.articleIconText}>◇</Text>
            </View>
            <View style={styles.articleBody}>
              <Text style={styles.articleMeta}>
                {item.category} · {item.views} reads
              </Text>
              <Text style={styles.articleTitle}>{item.title}</Text>
              <Text style={styles.articleSummary}>{item.summary}</Text>
            </View>
            <Text style={styles.articleArrow}>›</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No matching articles</Text>
              <Text style={styles.articleCount}>
                Try another search or choose a different topic.
              </Text>
              <PrimaryButton
                title="Clear search and filters"
                onPress={() => {
                  setSearch('');
                  setCategory(allCategories);
                }}
              />
            </View>
          ) : undefined
        }
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    gap: 11,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 30,
  },
  header: {
    gap: 10,
    paddingBottom: 5,
  },
  eyebrow: {
    color: colors.green,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  title: {
    color: colors.ink,
    fontSize: 29,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  searchCard: {
    gap: 12,
    marginTop: 5,
    borderRadius: 18,
    backgroundColor: colors.nav,
    padding: 16,
    shadowColor: colors.nav,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 3,
  },
  searchTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '800',
  },
  popularSearches: {
    color: colors.burgundyText,
    fontSize: 11,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    minHeight: 38,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    backgroundColor: colors.white,
    paddingHorizontal: 13,
  },
  categoryChipSelected: {
    borderColor: colors.green,
    backgroundColor: colors.mint,
  },
  categoryText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  categoryTextSelected: {
    color: colors.greenDark,
  },
  articleHeading: {
    marginTop: 7,
  },
  articleCount: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  articleCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: 14,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.035,
    shadowRadius: 10,
    elevation: 1,
  },
  pressed: {
    opacity: 0.75,
  },
  articleIcon: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.mint,
  },
  articleIconText: {
    color: colors.green,
    fontSize: 18,
    fontWeight: '800',
  },
  articleBody: {
    flex: 1,
    gap: 4,
  },
  articleMeta: {
    color: colors.green,
    fontSize: 10,
    fontWeight: '700',
  },
  articleTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  articleSummary: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  articleArrow: {
    color: colors.green,
    fontSize: 23,
    fontWeight: '700',
  },
  emptyCard: {
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: 17,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
});
