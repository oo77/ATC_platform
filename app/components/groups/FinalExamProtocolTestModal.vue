<template>
  <UiModal
    :is-open="isOpen"
    title="Протокол экзамена (тест) — Bayonnoma"
    size="lg"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Что попадёт в протокол из базы -->
      <div class="p-3 bg-primary/5 rounded-xl border border-primary/15 text-xs text-slate-600 dark:text-slate-300 space-y-1">
        <p v-if="info">
          <span class="font-bold">Guruh:</span> {{ info.groupCode }}
          <span class="mx-1.5 text-slate-400">·</span>
          <span class="font-bold">Tinglovchilar:</span> {{ info.studentsCount }}
          <span class="mx-1.5 text-slate-400">·</span>
          <span class="font-bold">С результатом теста:</span> {{ info.withResultCount }}
        </p>
        <p v-if="info"><span class="font-bold">Oʻquv kursi:</span> {{ info.courseName }}</p>
        <p>
          Группа, программа, список слушателей, баллы, оценки и итоговые числа подставляются
          автоматически по результатам тестов группы, остальное — из этой формы.
        </p>
        <p>
          Введённые значения запоминаются в этом браузере — кроме даты, номера протокола
          и названия курса, они у каждого протокола свои.
        </p>
      </div>

      <!-- Протокол -->
      <section class="space-y-3">
        <h4 :class="sectionClass">Протокол</h4>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label :class="labelClass">Дата <span class="text-danger">*</span></label>
            <input v-model="form.date" type="date" :class="inputClasses('date')" />
            <p v-if="info?.lastTestDate" class="mt-1 text-xs text-slate-500">
              Последний тест группы: {{ info.lastTestDate }}
            </p>
          </div>
          <div>
            <label :class="labelClass">№ протокола <span class="text-danger">*</span></label>
            <input
              v-model="form.number"
              type="text"
              maxlength="50"
              placeholder="AX-26-18"
              :class="inputClasses('number')"
            />
            <p v-if="lastNumber" class="mt-1 text-xs text-slate-500">
              В прошлый раз: {{ lastNumber }}
            </p>
          </div>
          <div>
            <label :class="labelClass">Место <span class="text-danger">*</span></label>
            <input
              v-model="form.place"
              type="text"
              maxlength="200"
              placeholder="Airports Training Center"
              :class="inputClasses('place')"
            />
          </div>
        </div>
      </section>

      <!-- Экзамен -->
      <section class="space-y-3">
        <h4 :class="sectionClass">Экзамен</h4>

        <!-- Imtihon shakli: два готовых варианта и свой -->
        <div>
          <label :class="labelClass">Imtihon shakli <span class="text-danger">*</span></label>
          <div class="space-y-2">
            <label
              v-for="option in examFormOptions"
              :key="option.key"
              :class="radioRowClass(form.examFormChoice === option.key)"
            >
              <input
                v-model="form.examFormChoice"
                type="radio"
                :value="option.key"
                class="mt-0.5 h-4 w-4 shrink-0 text-primary focus:ring-primary"
              />
              <span class="min-w-0 flex-1">
                <span class="block text-xs font-bold text-slate-500">{{ option.label }}</span>
                <span v-if="option.text" class="block text-sm text-slate-800 dark:text-slate-100">
                  {{ option.text }}
                </span>
              </span>
            </label>
          </div>
          <input
            v-if="form.examFormChoice === 'custom'"
            v-model="form.customExamForm"
            type="text"
            maxlength="300"
            placeholder="Впишите Imtihon shakli"
            :class="[inputClasses('examForm'), 'mt-2']"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label :class="labelClass">Imtihon vaqti <span class="text-danger">*</span></label>
            <input
              v-model="form.examTime"
              type="text"
              maxlength="100"
              placeholder="12:00-13:20"
              :class="inputClasses('examTime')"
            />
          </div>
          <div class="sm:col-span-2">
            <label :class="labelClass">Imtihon joyi <span class="text-danger">*</span></label>
            <input
              v-model="form.examPlace"
              type="text"
              maxlength="300"
              placeholder="Airports Training Center, (17-test xonasi)"
              :class="inputClasses('examPlace')"
            />
          </div>
        </div>
        <div>
          <label class="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-200">
            <input
              v-model="form.videoRecorded"
              type="checkbox"
              class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary dark:border-strokedark dark:bg-boxdark"
            />
            Imtihon jarayoni videoyozuvga olindi
          </label>
          <p class="mt-1 text-xs text-slate-500">
            Без галочки эти слова убираются из протокола (вторая страница, перед таблицей).
          </p>
        </div>

        <!-- Imtihon tartibi: название курса в кавычках или свой текст -->
        <div>
          <label :class="labelClass">Imtihon tartibi <span class="text-danger">*</span></label>
          <div class="space-y-2">
            <label :class="radioRowClass(form.orderChoice === 'course')">
              <input
                v-model="form.orderChoice"
                type="radio"
                value="course"
                class="mt-0.5 h-4 w-4 shrink-0 text-primary focus:ring-primary"
              />
              <span class="min-w-0 flex-1">
                <span class="block text-xs font-bold text-slate-500">Название курса в кавычках</span>
                <span class="block text-sm text-slate-800 dark:text-slate-100">
                  «{{ form.courseTitle || "…" }}» oʻquv kursi boʻyicha {{ info?.groupCode || "…" }}
                  guruhi tinglovchilarining yakuniy imtihonini oʻtkazish
                </span>
              </span>
            </label>
            <input
              v-if="form.orderChoice === 'course'"
              v-model="form.courseTitle"
              type="text"
              maxlength="200"
              placeholder="Aviatsiya xavfsizligi"
              :class="[inputClasses('courseTitle'), 'ml-7 !w-[calc(100%-1.75rem)]']"
            />
            <label :class="radioRowClass(form.orderChoice === 'custom')">
              <input
                v-model="form.orderChoice"
                type="radio"
                value="custom"
                class="mt-0.5 h-4 w-4 shrink-0 text-primary focus:ring-primary"
              />
              <span class="block text-xs font-bold text-slate-500">Свой текст</span>
            </label>
            <input
              v-if="form.orderChoice === 'custom'"
              v-model="form.customOrderText"
              type="text"
              maxlength="500"
              placeholder="Впишите текст «Imtihon tartibi» целиком"
              :class="[inputClasses('customOrderText'), 'ml-7 !w-[calc(100%-1.75rem)]']"
            />
          </div>
        </div>
      </section>

      <!-- Комиссия -->
      <section class="space-y-3">
        <h4 :class="sectionClass">Комиссия</h4>
        <div>
          <label :class="labelClass">
            Приказ о составе комиссии <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.order"
            type="text"
            maxlength="400"
            placeholder="2026-yil 23 oktyabrdagi 47-son"
            :class="inputClasses('order')"
          />
          <p class="mt-1 text-xs text-slate-500">
            …MChJning {{ form.order || "…" }} buyrugʻi bilan tasdiqlangan…
          </p>
        </div>

        <!-- Председатель: по умолчанию R.D. Kashayev или другой -->
        <div>
          <label :class="labelClass">
            Председатель (Komissiya raisi) <span class="text-danger">*</span>
          </label>
          <div class="space-y-2">
            <label :class="radioRowClass(form.chairmanChoice === 'default')">
              <input
                v-model="form.chairmanChoice"
                type="radio"
                value="default"
                class="mt-0.5 h-4 w-4 shrink-0 text-primary focus:ring-primary"
              />
              <span class="min-w-0 flex-1">
                <span class="block text-sm font-bold text-slate-800 dark:text-slate-100">
                  {{ DEFAULT_CHAIRMAN.fullName }}
                </span>
                <span class="block text-xs text-slate-500">{{ DEFAULT_CHAIRMAN.position }}</span>
              </span>
            </label>
            <label :class="radioRowClass(form.chairmanChoice === 'custom')">
              <input
                v-model="form.chairmanChoice"
                type="radio"
                value="custom"
                class="mt-0.5 h-4 w-4 shrink-0 text-primary focus:ring-primary"
              />
              <span class="block text-xs font-bold text-slate-500">Другой председатель</span>
            </label>
          </div>
          <div v-if="form.chairmanChoice === 'custom'" :class="[personGridClass, 'mt-2']">
            <input
              v-model="form.chairman.fullName"
              type="text"
              maxlength="100"
              placeholder="R.D. Kashayev"
              :class="inputClasses('chairman.fullName')"
            />
            <input
              v-model="form.chairman.position"
              type="text"
              maxlength="300"
              placeholder="Должность: «Airports Training Center» MChJ katta instruktor-oʻqituvchisi"
              :class="inputClasses('chairman.position')"
            />
          </div>
        </div>

        <div>
          <label :class="labelClass">
            Члены комиссии (Komissiya aʼzosi) <span class="text-danger">*</span>
          </label>
          <div class="space-y-2">
            <div
              v-for="(member, index) in form.members"
              :key="index"
              class="flex items-start gap-2"
            >
              <span class="w-5 shrink-0 pt-2.5 text-sm font-medium text-slate-400">{{ index + 1 }}.</span>
              <div :class="[personGridClass, 'flex-1']">
                <input
                  v-model="member.fullName"
                  type="text"
                  maxlength="100"
                  placeholder="X.M. Yunusov"
                  :class="inputClasses(`members.${index}.fullName`)"
                />
                <input
                  v-model="member.position"
                  type="text"
                  maxlength="300"
                  placeholder="Должность: «Airports Training Center» MChJ instruktor-oʻqituvchisi"
                  :class="inputClasses(`members.${index}.position`)"
                />
              </div>
              <button
                v-if="form.members.length > 1"
                type="button"
                class="p-2 text-slate-400 hover:text-danger transition-colors"
                title="Убрать"
                @click="form.members.splice(index, 1)"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div class="mt-2 flex items-center justify-between gap-3">
            <p class="text-xs text-slate-500">
              До {{ MAX_PROTOCOL_MEMBERS }} человек. У каждого своя строка в составе комиссии
              и своя подпись в конце протокола.
            </p>
            <UiButton
              v-if="form.members.length < MAX_PROTOCOL_MEMBERS"
              type="button"
              variant="outline"
              size="sm"
              class="gap-2 font-bold shrink-0"
              @click="form.members.push({ fullName: '', position: '' })"
            >
              <Plus class="w-4 h-4" />
              Добавить
            </UiButton>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label :class="labelClass">
              Членов комиссии по приказу <span class="text-danger">*</span>
            </label>
            <input
              v-model.number="form.approvedMembers"
              type="number"
              min="1"
              max="99"
              placeholder="3"
              :class="inputClasses('approvedMembers')"
            />
          </div>
          <div>
            <label :class="labelClass">
              Из них участвовали <span class="text-danger">*</span>
            </label>
            <input
              v-model.number="form.presentMembers"
              type="number"
              min="1"
              max="99"
              placeholder="3"
              :class="inputClasses('presentMembers')"
            />
          </div>
        </div>
        <p class="-mt-1 text-xs text-slate-500">
          Buyruq bilan tasdiqlangan {{ form.approvedMembers || "…" }} nafar komissiya aʼzosidan
          {{ form.presentMembers || "…" }} nafari ishtirok etdi.
        </p>

        <div>
          <label :class="labelClass">
            Перечень в скобках под «Imtihon tartibi» <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.commissionList"
            type="text"
            maxlength="300"
            placeholder="Kashayev R.D., Yunusov X.M., Xusniddinov Q.F."
            :class="inputClasses('commissionList')"
          />
        </div>
      </section>

      <!-- Председательствующий: при «другом» председателе -->
      <section v-if="form.chairmanChoice === 'custom'" class="space-y-3">
        <div class="flex items-center justify-between gap-3">
          <h4 :class="sectionClass">Raislik qiluvchi <span class="text-danger">*</span></h4>
          <button
            type="button"
            class="text-xs font-bold text-primary hover:underline"
            @click="copyChairmanToPresiding"
          >
            Как председатель
          </button>
        </div>
        <div :class="personGridClass">
          <input
            v-model="form.presiding.fullName"
            type="text"
            maxlength="100"
            placeholder="R.D. Kashayev"
            :class="inputClasses('presiding.fullName')"
          />
          <input
            v-model="form.presiding.position"
            type="text"
            maxlength="300"
            placeholder="Должность и роль: …katta instruktor-oʻqituvchisi, komissiya raisi"
            :class="inputClasses('presiding.position')"
          />
        </div>
      </section>

      <div class="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        <p v-if="errorMessage" class="mr-auto text-xs text-danger">{{ errorMessage }}</p>
        <UiButton type="button" variant="outline" @click="$emit('close')">
          Отмена
        </UiButton>
        <UiButton type="submit" variant="primary" :loading="loading">
          <Download v-if="!loading" class="w-4 h-4" />
          Скачать Word
        </UiButton>
      </div>
    </form>
  </UiModal>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { Download, Plus, Trash2 } from "lucide-vue-next";
import {
  MAX_PROTOCOL_MEMBERS,
  type FinalExamProtocolForm,
  type FinalExamProtocolPerson,
} from "../../../shared/utils/finalExamProtocol";

interface ProtocolTestInfo {
  groupCode: string;
  courseName: string;
  /** Краткое название курса — значение по умолчанию для «Imtihon tartibi» */
  courseTitle: string;
  studentsCount: number;
  withResultCount: number;
  /** Дата последнего завершённого теста группы (ГГГГ-ММ-ДД) */
  lastTestDate: string | null;
}

const props = defineProps<{
  isOpen: boolean;
  groupId: string;
  /** Идёт формирование файла */
  loading?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  submit: [form: FinalExamProtocolForm];
}>();

const { authFetch } = useAuthFetch();

/** Председатель по умолчанию; в роли председательствующего к должности добавляется «, komissiya raisi» */
const DEFAULT_CHAIRMAN: FinalExamProtocolPerson = {
  fullName: "R.D. Kashayev",
  position:
    '"Airports Training Center" MChJ aviatsiya xavfsizligi kurslari boʻyicha instruktor-oʻqituvchilar guruhi katta instruktor-oʻqituvchisi',
};

/** Готовые варианты «Imtihon shakli»; свой — вводится вручную */
const examFormOptions = [
  {
    key: "oral",
    label: "Устный экзамен",
    text: "ogʻzaki, biletlar boʻyicha (har bir biletda 5 ta savol)",
  },
  {
    key: "test",
    label: "Компьютерный тест",
    text: "kompyuterda test sinovi (100 ta test savoli) — aviatsiya xavfsizligi boʻyicha nazariy bilimlarni baholash",
  },
  { key: "custom", label: "Свой вариант", text: "" },
] as const;
type ExamFormChoice = (typeof examFormOptions)[number]["key"];

const sectionClass = "text-sm font-bold text-slate-900 dark:text-white";
const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";
const personGridClass = "grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-2";
const inputClass =
  "w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3.5 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800";
const radioRowClass = (active: boolean) => [
  "flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors",
  active
    ? "border-primary bg-primary/5"
    : "border-slate-200 hover:border-slate-300 dark:border-slate-700",
];

const emptyPerson = (): FinalExamProtocolPerson => ({ fullName: "", position: "" });

const form = ref({
  date: "",
  number: "",
  place: "",
  examFormChoice: "test" as ExamFormChoice,
  customExamForm: "",
  examTime: "",
  examPlace: "",
  videoRecorded: true,
  orderChoice: "course" as "course" | "custom",
  courseTitle: "",
  customOrderText: "",
  order: "",
  chairmanChoice: "default" as "default" | "custom",
  chairman: emptyPerson(),
  members: [emptyPerson()],
  approvedMembers: "" as number | "",
  presentMembers: "" as number | "",
  commissionList: "",
  presiding: emptyPerson(),
});
const info = ref<ProtocolTestInfo | null>(null);
const invalid = ref<string[]>([]);
const errorMessage = ref("");

// Последние введённые значения запоминаются в браузере — их не нужно набирать заново для
// следующей группы. Не запоминается то, что у каждого протокола своё: дата, номер
// (прошлый номер только показывается подсказкой) и название курса (оно берётся из группы).
const STORAGE_KEY = "atc_final_exam_protocol_test_form";
const NOT_REMEMBERED = ["date", "number", "courseTitle"];
/** Номер протокола, скачанного в прошлый раз */
const lastNumber = ref("");

const restoreForm = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!saved || typeof saved !== "object") return;

    const text = (value: unknown) => (typeof value === "string" ? value : "");
    const count = (value: unknown) => (typeof value === "number" ? value : "");
    const person = (value: any): FinalExamProtocolPerson => ({
      fullName: text(value?.fullName),
      position: text(value?.position),
    });
    Object.assign(form.value, {
      place: text(saved.place),
      examFormChoice: examFormOptions.some((o) => o.key === saved.examFormChoice)
        ? saved.examFormChoice
        : "test",
      customExamForm: text(saved.customExamForm),
      examTime: text(saved.examTime),
      examPlace: text(saved.examPlace),
      videoRecorded: saved.videoRecorded !== false,
      orderChoice: saved.orderChoice === "custom" ? "custom" : "course",
      customOrderText: text(saved.customOrderText),
      order: text(saved.order),
      chairmanChoice: saved.chairmanChoice === "custom" ? "custom" : "default",
      chairman: person(saved.chairman),
      members:
        Array.isArray(saved.members) && saved.members.length > 0
          ? saved.members.slice(0, MAX_PROTOCOL_MEMBERS).map(person)
          : [emptyPerson()],
      approvedMembers: count(saved.approvedMembers),
      presentMembers: count(saved.presentMembers),
      commissionList: text(saved.commissionList),
      presiding: person(saved.presiding),
    });
    lastNumber.value = text(saved.lastNumber);
  } catch (error) {
    // повреждённые или недоступные данные — форма остаётся пустой
    console.error("Failed to restore protocol form:", error);
  }
};

onMounted(() => {
  restoreForm();
  watch(
    [form, lastNumber],
    () => {
      const remembered = Object.fromEntries(
        Object.entries(form.value).filter(([field]) => !NOT_REMEMBERED.includes(field)),
      );
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...remembered, lastNumber: lastNumber.value }),
        );
      } catch (error) {
        console.error("Failed to save protocol form:", error);
      }
    },
    { deep: true },
  );
});

const inputClasses = (field: string) => [
  inputClass,
  { "border-danger focus:border-danger focus:ring-danger": invalid.value.includes(field) },
];

const clean = (text: string) => text.replace(/\s+/g, " ").trim();
const cleanPerson = (person: FinalExamProtocolPerson): FinalExamProtocolPerson => ({
  fullName: clean(person.fullName),
  position: clean(person.position),
});

const loadInfo = async () => {
  try {
    info.value = await authFetch<ProtocolTestInfo>(
      `/api/groups/${props.groupId}/final-exam-protocol-test-info`,
    );
    if (!form.value.courseTitle) form.value.courseTitle = info.value.courseTitle;
    // Дата протокола по умолчанию — день последнего теста группы
    if (!form.value.date && info.value.lastTestDate) form.value.date = info.value.lastTestDate;
  } catch (error) {
    console.error("Error loading protocol info:", error);
  }
};

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) loadInfo();
  },
);

// Другая группа — другой протокол: его дата, номер и название курса не переносятся
watch(
  () => props.groupId,
  () => {
    info.value = null;
    Object.assign(form.value, { date: "", number: "", courseTitle: "" });
  },
);

const copyChairmanToPresiding = () => {
  const chairman = cleanPerson(form.value.chairman);
  form.value.presiding = {
    fullName: chairman.fullName,
    position: chairman.position ? `${chairman.position}, komissiya raisi` : "",
  };
};

const handleSubmit = () => {
  const value = form.value;
  const missing: string[] = [];
  const required = (field: string, text: string) => {
    if (!text) missing.push(field);
    return text;
  };
  const requiredPerson = (field: string, person: FinalExamProtocolPerson) => {
    const cleaned = cleanPerson(person);
    required(`${field}.fullName`, cleaned.fullName);
    required(`${field}.position`, cleaned.position);
    return cleaned;
  };
  const count = (field: string, number: number | "") => {
    const valid = typeof number === "number" && Number.isInteger(number) && number >= 1;
    if (!valid) missing.push(field);
    return valid ? number : 0;
  };

  // Полностью пустые строки членов комиссии пропускаются
  const memberRows = value.members
    .map((member, index) => ({ index, member: cleanPerson(member) }))
    .filter(({ member }) => member.fullName || member.position);
  if (memberRows.length === 0) missing.push("members.0.fullName", "members.0.position");

  // Председатель по умолчанию — готовый; председательствующий тогда он же
  const defaultChairman = value.chairmanChoice === "default";
  const chairman = defaultChairman
    ? { ...DEFAULT_CHAIRMAN }
    : requiredPerson("chairman", value.chairman);
  const presiding = defaultChairman
    ? { fullName: chairman.fullName, position: `${chairman.position}, komissiya raisi` }
    : requiredPerson("presiding", value.presiding);

  const examForm =
    value.examFormChoice === "custom"
      ? required("examForm", clean(value.customExamForm))
      : examFormOptions.find((option) => option.key === value.examFormChoice)!.text;

  const customOrder = value.orderChoice === "custom";
  const courseTitle = customOrder ? "" : required("courseTitle", clean(value.courseTitle));
  const examOrderText = customOrder ? required("customOrderText", clean(value.customOrderText)) : null;

  const result: FinalExamProtocolForm = {
    date: required("date", value.date),
    number: required("number", clean(value.number)),
    place: required("place", clean(value.place)),
    presiding,
    approvedMembers: count("approvedMembers", value.approvedMembers),
    presentMembers: count("presentMembers", value.presentMembers),
    examForm,
    examTime: required("examTime", clean(value.examTime)),
    examPlace: required("examPlace", clean(value.examPlace)),
    videoRecorded: value.videoRecorded,
    courseTitle,
    examOrderText,
    commissionList: required("commissionList", clean(value.commissionList)),
    order: required("order", clean(value.order)),
    chairman,
    // В протоколе-тесте заместителя председателя нет
    deputy: null,
    members: memberRows.map(({ index, member }) => requiredPerson(`members.${index}`, member)),
  };

  invalid.value = missing;
  errorMessage.value = "";
  if (missing.length > 0) {
    errorMessage.value = "Заполните выделенные поля";
    return;
  }
  if (result.presentMembers > result.approvedMembers) {
    invalid.value = ["presentMembers"];
    errorMessage.value = "Участвовавших не может быть больше, чем членов комиссии по приказу";
    return;
  }

  lastNumber.value = result.number;
  emit("submit", result);
};
</script>
