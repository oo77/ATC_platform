/**
 * Course Planner 2 API Integration Client
 * ========================================
 * Сервис для взаимодействия ATC_platform с внешним API course-planner2.
 */

export interface CoursePlannerConfig {
  url: string;
  token: string;
  enabled: boolean;
}

export interface MultilingualField {
  uz?: string | null;
  ru?: string | null;
  en?: string | null;
}

export interface StudentResource {
  id?: string;
  pinfl: string;
  name: string;
  organization: {
    id: string | null;
    name: string | null;
    tin: string | null;
  } | null;
  department: MultilingualField | string | null;
  position: MultilingualField | string | null;
  hireDate: string | null;
  onecId: string | null;
  isActive: boolean;
  photo: string | null;
  updatedAt: string | null;
  enrolledGroups?: Array<{
    id: string;
    name: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
    location: string | null;
    course: {
      id: string;
      name: string | null;
      code: string | null;
    } | null;
  }>;
}

export interface GroupResource {
  group: {
    id: string;
    name: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
    location: string | null;
    maxStudents: number;
    currentStudents: number;
    isPublished: boolean;
    course: {
      id: string;
      name: string;
      code: string | null;
      courseType: string | null;
      duration: number | null;
    } | null;
  };
  students: Array<{ pinfl: string; name: string }>;
  total: number;
}

import { getSystemSetting } from "./systemSettings";

export function getCoursePlannerConfig(): CoursePlannerConfig {
  const rawUrl = getSystemSetting(
    "COURSE_PLANNER_URL",
    process.env.COURSE_PLANNER_URL || "https://app.courseplanner.uz"
  );
  const token = getSystemSetting(
    "COURSE_PLANNER_API_TOKEN",
    process.env.COURSE_PLANNER_API_TOKEN || "5de66e601b8ff56283a597183e9801533ac08b1f7a4af93ccb37fc9c10984952"
  );
  const enabled =
    getSystemSetting("COURSE_PLANNER_ENABLED", process.env.COURSE_PLANNER_ENABLED || "true") === "true";

  return {
    url: (rawUrl || "https://app.courseplanner.uz").replace(/\/+$/, ""),
    token: token || "",
    enabled,
  };
}

/**
 * Выполняет тестовый запрос к course-planner2 для проверки URL и API токена.
 */
export async function testCoursePlannerConnection(
  overrideUrl?: string,
  overrideToken?: string
): Promise<{ success: boolean; message: string; details?: any }> {
  const config = getCoursePlannerConfig();
  const url = (overrideUrl || config.url).replace(/\/+$/, "");
  const token = overrideToken !== undefined ? overrideToken : config.token;

  if (!url) {
    return { success: false, message: "URL сервера course-planner2 не указан" };
  }

  if (!token) {
    return { success: false, message: "API Токен для course-planner2 не указан" };
  }

  try {
    // Запрашиваем эндпоинт external без параметров resource — сервер должен вернуть 400 с типом availableResources если авторизация успешна, или 401 если токен неверный.
    const response = await fetch(`${url}/api/external`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-API-Key": token,
        Accept: "application/json",
      },
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      return {
        success: false,
        message: data.error || "Ошибка авторизации: недействительный API-токен",
      };
    }

    if (response.status === 400 || response.ok) {
      return {
        success: true,
        message: "Соединение успешно установлено! API course-planner2 доступен.",
        details: data,
      };
    }

    return {
      success: false,
      message: data.error || `Сервер ответил с кодом ошибки ${response.status}`,
    };
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    if (errorMsg.includes("ECONNREFUSED") || errorMsg.includes("fetch failed")) {
      return {
        success: false,
        message: `Не удалось подключиться к серверу по адресу ${url}. Убедитесь, что course-planner2 запущен.`,
      };
    }
    return {
      success: false,
      message: `Ошибка сетевого подключения: ${errorMsg}`,
    };
  }
}

/**
 * Получить данные слушателя из course-planner2
 */
export async function fetchCoursePlannerStudent(
  params: { pinfl?: string; id?: string; onecId?: string },
  overrideConfig?: { url?: string; token?: string }
): Promise<{ success: boolean; data?: StudentResource; error?: string }> {
  const config = getCoursePlannerConfig();
  const url = (overrideConfig?.url || config.url).replace(/\/+$/, "");
  const token = overrideConfig?.token !== undefined ? overrideConfig.token : config.token;

  const queryParams = new URLSearchParams();
  queryParams.set("resource", "student");
  if (params.pinfl) queryParams.set("pinfl", params.pinfl);
  if (params.id) queryParams.set("id", params.id);
  if (params.onecId) queryParams.set("onecId", params.onecId);

  try {
    const response = await fetch(`${url}/api/external?${queryParams.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-API-Key": token,
        Accept: "application/json",
      },
    });

    const resData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: resData.error || `Ошибка сервера (${response.status})`,
      };
    }

    return {
      success: true,
      data: resData.data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Ошибка при вызове API course-planner2",
    };
  }
}

/**
 * Получить данные группы из course-planner2
 */
export async function fetchCoursePlannerGroup(
  params: { id?: string; name?: string; code?: string },
  overrideConfig?: { url?: string; token?: string }
): Promise<{ success: boolean; data?: GroupResource; error?: string }> {
  const config = getCoursePlannerConfig();
  const url = (overrideConfig?.url || config.url).replace(/\/+$/, "");
  const token = overrideConfig?.token !== undefined ? overrideConfig.token : config.token;

  const queryParams = new URLSearchParams();
  queryParams.set("resource", "group");
  if (params.id) queryParams.set("id", params.id);
  if (params.name) queryParams.set("name", params.name);
  if (params.code) queryParams.set("code", params.code);

  try {
    const response = await fetch(`${url}/api/external?${queryParams.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-API-Key": token,
        Accept: "application/json",
      },
    });

    const resData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: resData.error || `Ошибка сервера (${response.status})`,
      };
    }

    return {
      success: true,
      data: resData.data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Ошибка при вызове API course-planner2",
    };
  }
}

/**
 * Получить список слушателей из course-planner2 с пагинацией и фильтрами
 */
export async function fetchCoursePlannerStudents(
  params?: {
    page?: number;
    limit?: number;
    tin?: string;
    organizationId?: string;
    groupId?: string;
    search?: string;
    department?: string;
  },
  overrideConfig?: { url?: string; token?: string }
): Promise<{
  success: boolean;
  data?: StudentResource[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  error?: string;
}> {
  const config = getCoursePlannerConfig();
  const url = (overrideConfig?.url || config.url).replace(/\/+$/, "");
  const token = overrideConfig?.token !== undefined ? overrideConfig.token : config.token;

  const queryParams = new URLSearchParams();
  queryParams.set("resource", "students");
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.limit) queryParams.set("limit", String(params.limit));
  if (params?.tin) queryParams.set("tin", params.tin);
  if (params?.organizationId) queryParams.set("organizationId", params.organizationId);
  if (params?.groupId) queryParams.set("groupId", params.groupId);
  if (params?.search) queryParams.set("search", params.search);
  if (params?.department) queryParams.set("department", params.department);

  try {
    const response = await fetch(`${url}/api/external?${queryParams.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-API-Key": token,
        Accept: "application/json",
      },
    });

    const resData = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: resData.error || `Ошибка сервера course-planner2 (${response.status})`,
      };
    }

    return {
      success: true,
      data: resData.data || [],
      total: Number(resData.total) || 0,
      page: Number(resData.page) || 1,
      limit: Number(resData.limit) || 100,
      totalPages: Number(resData.totalPages) || 1,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Ошибка при вызове API course-planner2",
    };
  }
}

/**
 * Получить ВСЕХ активных слушателей из course-planner2 (с обходом всех страниц при необходимости)
 */
export async function fetchAllCoursePlannerStudents(
  overrideConfig?: { url?: string; token?: string },
  maxPages?: number
): Promise<{
  success: boolean;
  students: StudentResource[];
  total: number;
  error?: string;
}> {
  const config = getCoursePlannerConfig();
  const url = (overrideConfig?.url || config.url).replace(/\/+$/, "");
  const token = overrideConfig?.token !== undefined ? overrideConfig.token : config.token;

  if (!url) {
    return {
      success: false,
      students: [],
      total: 0,
      error: "URL сервера course-planner2 не указан в настройках",
    };
  }
  if (!token) {
    return {
      success: false,
      students: [],
      total: 0,
      error: "API-токен для course-planner2 не указан в настройках",
    };
  }

  // 1. Fetch first page to inspect total count and pages
  const PAGE_SIZE = 100;
  const firstPage = await fetchCoursePlannerStudents(
    { page: 1, limit: PAGE_SIZE },
    { url, token }
  );

  if (!firstPage.success) {
    return {
      success: false,
      students: [],
      total: 0,
      error: firstPage.error || "Не удалось получить первую страницу слушателей из Course Planner 2",
    };
  }

  const allStudents: StudentResource[] = [...(firstPage.data || [])];
  const totalCount = Number(firstPage.total) || allStudents.length;
  const totalPages = Number(firstPage.totalPages) || Math.ceil(totalCount / PAGE_SIZE);
  const targetPages = maxPages && maxPages > 0 ? Math.min(totalPages, maxPages) : totalPages;

  console.log(`📡 Course Planner API returned ${totalCount} total students (${targetPages}/${totalPages} pages to fetch).`);

  // 2. Fetch remaining pages with concurrency = 5
  if (targetPages > 1) {
    const pagesToFetch: number[] = [];
    for (let p = 2; p <= targetPages; p++) {
      pagesToFetch.push(p);
    }

    const CONCURRENCY = 5;
    for (let i = 0; i < pagesToFetch.length; i += CONCURRENCY) {
      const pageBatch = pagesToFetch.slice(i, i + CONCURRENCY);
      const batchResponses = await Promise.all(
        pageBatch.map((p) =>
          fetchCoursePlannerStudents({ page: p, limit: PAGE_SIZE }, { url, token })
        )
      );

      for (const bRes of batchResponses) {
        if (bRes.success && bRes.data && bRes.data.length > 0) {
          allStudents.push(...bRes.data);
        }
      }
    }
  }

  return {
    success: true,
    students: allStudents,
    total: allStudents.length,
  };
}

