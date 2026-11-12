export type Student = {
  id: number;
  name: string;
  email: string;
  student_id: string | null;
  college: string | null;
  program: string | null;
  year_level: string | null;
  profile_photo_url: string | null;
};

export type SupportType = {
  id: number;
  name: string;
  description: string | null;
};

export type TicketUpdate = {
  event_type: string;
  body: string;
  status: string | null;
  author: string;
  created_at: string | null;
};

export type Ticket = {
  ticket_number: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  support_type: string;
  location: string | null;
  description: string;
  created_at: string | null;
  updated_at: string | null;
  updates?: TicketUpdate[];
};

export type PaymentQueueEntry = {
  id: number;
  queueNumber: string;
  status: 'Waiting' | 'Called' | 'Serving' | 'Served' | 'Skipped';
  paymentType: 'Tuition' | 'Balance' | 'Other';
  queueType: 'Regular' | 'Priority';
  otherDetails: string | null;
  position: number | null;
  calledAt: string | null;
};

export type PaymentQueueStatus = {
  entries: PaymentQueueEntry[];
  currentCall: {
    queueNumber: string;
    paymentType: string;
    queueType: string;
  } | null;
  waitingCount: number;
};

export type HelpArticle = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  views: number;
  updated: string;
};

export type HelpArticleSection = {
  title: string;
  paragraphs?: string[];
  steps?: string[];
};

export type HelpArticleDetails = HelpArticle & {
  sections: HelpArticleSection[];
};

export type StudentNotification = {
  id: string;
  title: string;
  message: string;
  category: string;
  url: string | null;
  read_at: string | null;
  created_at: string | null;
};

export type AuthResponse = {
  token: string;
  user: Student;
};

export type PaginatedResponse<T> = {
  data: T[];
};

export type TicketPage = {
  data: Ticket[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
  stats: {
    active: number;
    resolved: number;
  };
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');
const API_TIMEOUT_MS = 20000;

if (!apiUrl) {
  throw new Error('Set EXPO_PUBLIC_API_URL in mobile/.env before starting Expo.');
}

const apiOrigin = new URL(apiUrl).origin;

async function request<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH';
    token?: string;
    body?: object | FormData;
  } = {},
): Promise<T> {
  let response: Response;
  let payload: {
    message?: string;
    errors?: Record<string, string[]>;
    [key: string]: unknown;
  };
  const isMultipart = options.body instanceof FormData;
  const isJson = options.body && !isMultipart;
  const requestBody = options.body instanceof FormData
    ? options.body
    : options.body
      ? JSON.stringify(options.body)
      : undefined;
  const requestUrl = `${apiUrl}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    response = await fetch(requestUrl, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(isJson ? { 'Content-Type': 'application/json' } : {}),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      ...(requestBody ? { body: requestBody } : {}),
      signal: controller.signal,
    });
    payload = (await response.json()) as typeof payload;
  } catch (cause) {
    if (controller.signal.aborted) {
      throw new Error('The server took too long to respond. Please try again.');
    }

    const reason = cause instanceof Error ? ` (${cause.message})` : '';
    throw new Error(`Network request failed for ${path}${reason}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const firstValidationError = Object.values(payload.errors ?? {})[0]?.[0];
    throw new ApiError(
      firstValidationError ?? payload.message ?? 'Something went wrong. Please try again.',
      response.status,
    );
  }

  return payload as T;
}

export function getProfilePhotoUrl(photoUrl: string | null): string | null {
  if (!photoUrl) {
    return null;
  }

  const photoPath = new URL(photoUrl, apiOrigin).pathname;

  return `${apiOrigin}${photoPath}`;
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),
  register: (input: {
    name: string;
    email: string;
    student_id: string;
    college: string;
    program: string;
    year_level: string;
    password: string;
    password_confirmation: string;
  }) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: input,
    }),
  currentStudent: (token: string) =>
    request<{ data: Student }>('/user', { token }).then((response) => response.data),
  uploadProfilePhoto: (
    token: string,
    image: FormData | { profile_photo: string },
  ) =>
    request<{ data: Student }>('/user/profile-photo', {
      method: 'POST',
      token,
      body: image,
    }).then((response) => response.data),
  logout: (token: string) =>
    request<{ message: string }>('/auth/logout', { method: 'POST', token }),
  supportTypes: (token: string) =>
    request<PaginatedResponse<SupportType>>('/support-types', { token }).then(
      (response) => response.data,
    ),
  tickets: (
    token: string,
    filters: { page: number; search: string; status: string | null },
  ) => {
    const query = new URLSearchParams({ page: String(filters.page) });

    if (filters.search) {
      query.set('search', filters.search);
    }

    if (filters.status) {
      query.set('status', filters.status);
    }

    return request<TicketPage>(`/tickets?${query.toString()}`, { token });
  },
  ticket: (token: string, ticketNumber: string) =>
    request<{ data: Ticket }>(`/tickets/${encodeURIComponent(ticketNumber)}`, {
      token,
    }).then((response) => response.data),
  createTicket: (
    token: string,
    input: {
      subject: string;
      category: string;
      support_type_id: number;
      location: string;
      description: string;
    },
  ) =>
    request<{ data: Ticket }>('/tickets', {
      method: 'POST',
      token,
      body: input,
    }).then((response) => response.data),
  replyToTicket: (token: string, ticketNumber: string, message: string) =>
    request<{ data: Ticket }>(
      `/tickets/${encodeURIComponent(ticketNumber)}/replies`,
      {
        method: 'POST',
        token,
        body: { message },
      },
    ).then((response) => response.data),
  paymentQueueStatus: (token: string) =>
    request<PaymentQueueStatus>('/payment-queue/status', { token }),
  notifications: (token: string, page = 1) =>
    request<{
      data: StudentNotification[];
      meta: { current_page: number; last_page: number; unread_count: number };
    }>(`/notifications?page=${page}`, { token }),
  markNotificationRead: (token: string, notificationId: string) =>
    request<{ message: string; unread_count: number }>(
      `/notifications/${encodeURIComponent(notificationId)}/read`,
      { method: 'PATCH', token },
    ),
  markAllNotificationsRead: (token: string) =>
    request<{ message: string; unread_count: number }>('/notifications/read-all', {
      method: 'PATCH',
      token,
    }),
  helpArticles: (token: string) =>
    request<{ data: HelpArticle[]; meta: { categories: string[] } }>('/knowledge-base', {
      token,
    }),
  searchHelpArticles: (token: string, search: string, category: string | null) => {
    const query = new URLSearchParams();

    if (search.trim()) {
      query.set('search', search.trim());
    }

    if (category) {
      query.set('category', category);
    }

    const suffix = query.size ? `?${query.toString()}` : '';

    return request<{ data: HelpArticle[]; meta: { categories: string[] } }>(
      `/knowledge-base${suffix}`,
      { token },
    );
  },
  helpArticle: (token: string, slug: string) =>
    request<{ data: HelpArticleDetails }>(
      `/knowledge-base/${encodeURIComponent(slug)}`,
      { token },
    ).then((response) => response.data),
  joinPaymentQueue: (
    token: string,
    input: {
      payment_type: 'Tuition' | 'Balance' | 'Other';
      queue_type: 'Regular' | 'Priority';
      other_details?: string;
    },
  ) =>
    request<{ data: PaymentQueueEntry }>('/payment-queue', {
      method: 'POST',
      token,
      body: input,
    }).then((response) => response.data),
};
