<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KnowledgeBaseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $articles = collect($this->articles());
        $search = mb_strtolower(trim((string) $request->query('search', '')));
        $category = trim((string) $request->query('category', ''));

        if ($search !== '') {
            $articles = $articles->filter(
                static fn (array $article): bool => str_contains(
                    mb_strtolower($article['title'].' '.$article['summary'].' '.$article['category']),
                    $search,
                ),
            );
        }

        if ($category !== '') {
            $articles = $articles->where('category', $category);
        }

        return response()->json([
            'data' => $articles->values(),
            'meta' => [
                'categories' => collect($this->articles())->pluck('category')->unique()->values(),
            ],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $article = collect($this->articles())->firstWhere('slug', $slug);

        abort_unless($article, 404);

        return response()->json([
            'data' => [
                ...$article,
                'sections' => [
                    [
                        'title' => 'Before you begin',
                        'paragraphs' => [
                            'Make sure you are using your student account and have your account details available. Never share your password or security codes with another person.',
                        ],
                    ],
                    [
                        'title' => 'Try these steps',
                        'steps' => [
                            'Save your work and restart the app or device.',
                            'Check your connection and confirm you are using the latest school-approved version.',
                            'Try the action again and note any message that appears.',
                            'If the issue continues, create a support ticket and include what you have already tried.',
                        ],
                    ],
                ],
            ],
        ]);
    }

    /**
     * @return array<int, array{slug: string, title: string, category: string, summary: string, views: int, updated: string, published: bool}>
     */
    private function articles(): array
    {
        return require resource_path('data/articles.php');
    }
}
