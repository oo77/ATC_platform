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

export interface StudentResource {
  pinfl: string;
  name: string;
  organization: {
    id: string | null;
    name: string | null;
    tin: string | null;
  };
  department: string | null;
  position: string | null;
  hireDate: string | null;
  onecId: string | null;
  isActive: boolean;
  photo: string | null;
  updatedAt: string | null;
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

export function getCoursePlannerConfig(): CoursePlannerConfig {
  return {
    url: (process.env.COURSE_PLANNER_URL || "http://localhost:3000").replace(/\/+$/, ""),
    token: process.env.COURSE_PLANNER_API_TOKEN || "",
    enabled: process.env.COURSE_PLANNER_ENABLED === "true",
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
