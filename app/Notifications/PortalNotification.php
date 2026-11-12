<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class PortalNotification extends Notification
{
    /**
     * @param  array{title: string, message: string, url: string, category: string}  $data
     */
    public function __construct(public array $data) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array{title: string, message: string, url: string, category: string} */
    public function toArray(object $notifiable): array
    {
        return $this->data;
    }
}
