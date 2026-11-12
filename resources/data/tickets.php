<?php

$records = [
    ['NX-2026-004281', 'Unable to access company VPN', 'Network', 'High', 'In Progress', 'Alex Morgan', 'IT Support', 'user@nexadesk.com', '12 min ago'],
    ['NX-2026-004282', 'Outlook calendar is not syncing', 'Software', 'Medium', 'Waiting', 'Jordan Lee', 'Technical Support', 'user@nexadesk.com', '1 hour ago'],
    ['NX-2026-004283', 'Request access to design workspace', 'Account', 'Low', 'Resolved', 'Casey Park', 'IT Support', 'mia@nexadesk.com', 'Yesterday'],
    ['NX-2026-004284', 'New laptop setup for onboarding', 'Hardware', 'Medium', 'Open', 'Sam Rivera', 'IT Support', 'user@nexadesk.com', 'Yesterday'],
    ['NX-2026-004285', 'Suspicious email received', 'Security', 'Critical', 'Escalated', 'Morgan Davis', 'Security', 'olivia@nexadesk.com', '2 hours ago'],
    ['NX-2026-004286', 'Printer queue stuck on floor three', 'Hardware', 'Medium', 'New', 'Unassigned', 'IT Support', 'ethan@nexadesk.com', 'Today'],
    ['NX-2026-004287', 'Shared mailbox permission request', 'Account', 'Low', 'Open', 'Riley Chen', 'Customer Service', 'user@nexadesk.com', '2 days ago'],
    ['NX-2026-004288', 'Two-factor prompt not appearing', 'Account', 'High', 'In Progress', 'Taylor Brooks', 'Technical Support', 'user@nexadesk.com', '3 hours ago'],
    ['NX-2026-004289', 'Billing portal shows an incorrect total', 'Billing', 'High', 'Waiting', 'Avery Scott', 'Billing', 'noah@nexadesk.com', '4 hours ago'],
    ['NX-2026-004290', 'Install approved design software', 'Software', 'Low', 'Resolved', 'Jamie Chen', 'IT Support', 'sophia@nexadesk.com', 'Sep 25'],
    ['NX-2026-004291', 'Wi-Fi drops in meeting rooms', 'Network', 'High', 'Open', 'Alex Morgan', 'Technical Support', 'marcus@nexadesk.com', 'Today'],
    ['NX-2026-004292', 'Password reset link has expired', 'Account', 'Medium', 'Resolved', 'Jordan Lee', 'IT Support', 'ava@nexadesk.com', 'Sep 24'],
    ['NX-2026-004293', 'External monitor is not detected', 'Hardware', 'Medium', 'New', 'Unassigned', 'IT Support', 'user@nexadesk.com', 'Today'],
    ['NX-2026-004294', 'Cloud files are not synchronizing', 'Software', 'Low', 'Closed', 'Casey Park', 'Technical Support', 'mia@nexadesk.com', 'Sep 22'],
    ['NX-2026-004295', 'Request secure file transfer access', 'Security', 'Critical', 'Escalated', 'Morgan Davis', 'Security', 'olivia@nexadesk.com', 'Yesterday'],
    ['NX-2026-004296', 'Mobile email setup assistance', 'General Inquiry', 'Low', 'Resolved', 'Riley Chen', 'Customer Service', 'ethan@nexadesk.com', 'Sep 21'],
    ['NX-2026-004297', 'Application crashes after update', 'Bug Report', 'High', 'In Progress', 'Taylor Brooks', 'Technical Support', 'noah@nexadesk.com', 'Today'],
    ['NX-2026-004298', 'Headset microphone is not recognized', 'Hardware', 'Medium', 'Open', 'Sam Rivera', 'IT Support', 'sophia@nexadesk.com', 'Yesterday'],
    ['NX-2026-004299', 'Request a new feature for reports', 'Feature Request', 'Low', 'New', 'Unassigned', 'Customer Service', 'marcus@nexadesk.com', 'Today'],
    ['NX-2026-004300', 'Shared drive access required', 'Account', 'Medium', 'Waiting', 'Jamie Chen', 'IT Support', 'ava@nexadesk.com', 'Sep 20'],
];

return array_map(static fn (array $record): array => [
    'id' => $record[0],
    'subject' => $record[1],
    'category' => $record[2],
    'priority' => $record[3],
    'status' => $record[4],
    'agent' => $record[5],
    'team' => $record[6],
    'email' => $record[7],
    'updated' => $record[8],
    'created' => 'Sep 28, 2026',
    'description' => $record[1].'. The issue is affecting my work. I have restarted the device and checked the usual settings, but it continues.',
    'messages' => [
        ['author' => 'John Davis', 'role' => 'Customer', 'text' => 'I am having trouble with this request. Could you help me look into it?', 'time' => '9:42 AM'],
        ['author' => $record[5], 'role' => 'Agent', 'text' => 'Thanks for letting us know. I am reviewing the details and will follow up shortly.', 'time' => '10:18 AM'],
    ],
], $records);
