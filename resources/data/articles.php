<?php

$articles = [
    ['How to reset your password', 'Account', 'Follow the secure self-service password reset flow and regain access.', 248],
    ['Connect to the company Wi-Fi', 'Network', 'Set up a trusted connection from your managed laptop or phone.', 192],
    ['Fix common printer problems', 'Hardware', 'Clear stalled jobs and reconnect to a shared office printer.', 176],
    ['Install approved software', 'Software', 'Find and install software from the company catalog.', 164],
    ['Report a security incident', 'Security', 'What to do if you spot a suspicious email or unexpected sign-in.', 152],
    ['Set up multi-factor authentication', 'Account', 'Enroll a new device and keep your sign-in protected.', 140],
    ['Troubleshoot your VPN connection', 'Network', 'Resolve common connection and certificate issues.', 118],
    ['Request access to a shared drive', 'Account', 'Ask for project folder access through the correct approver.', 102],
    ['Prepare a laptop for travel', 'Hardware', 'Security checks to complete before working away from the office.', 88],
    ['Configure email on your phone', 'Software', 'Add your company inbox to an approved mobile device.', 72],
    ['Resolve a slow computer', 'Troubleshooting', 'Simple checks to improve everyday computer performance.', 68],
    ['Connect a second monitor', 'Hardware', 'Set up an external display and choose the right display mode.', 54],
    ['Update your billing details', 'Billing', 'Find the right place to review billing information and invoices.', 49],
    ['Keep your account secure', 'Security', 'Everyday steps to protect your account and company data.', 42],
    ['Getting started with Problinx', 'Getting Started', 'Learn how to create, track, and update support requests.', 36],
];

return array_map(static fn (array $article, int $index): array => [
    'slug' => 'article-'.($index + 1),
    'title' => $article[0],
    'category' => $article[1],
    'summary' => $article[2],
    'views' => $article[3],
    'updated' => 'Sep '.(27 - ($index % 12)).', 2026',
    'published' => true,
], $articles, array_keys($articles));
