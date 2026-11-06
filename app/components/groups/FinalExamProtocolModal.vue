<template>
  <UiModal
    :is-open="isOpen"
    title="Протокол экзамена (Bayonnoma)"
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
        </p>
        <p v-if="info"><span class="font-bold">Oʻquv kursi:</span> {{ info.courseName }}</p>
        <p>
          Группа, название программы и список слушателей подставляются автоматически,
          остальное — из этой формы, как введено.
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
          </div>
          <div>
            <label :class="labelClass">№ протокола <span class="text-danger">*</span></label>
            <input
              v-model="form.number"
              type="text"
              maxlength="50"
              placeholder="AX-26-04"
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
              placeholder="Navoiy xalqaro aeroporti bazasi"
              :class="inputClasses('place')"
            />
          </div>
        </div>
      </section>

      <!-- Экзамен -->
      <section class="space-y-3">
        <h4 :class="sectionClass">Экзамен</h4>
        <div>
          <label :class="labelClass">Imtihon shakli <span class="text-danger">*</span></label>
          <input
            v-model="form.examForm"
            type="text"
            maxlength="300"
            placeholder="ogʻzaki, biletlar boʻyicha (har bir biletda 5 ta savol)"
            :class="inputClasses('examForm')"
          />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label :class="labelClass">Imtihon vaqti <span class="text-danger">*</span></label>
            <input
              v-model="form.examTime"
              type="text"
              maxlength="100"
              placeholder="14:00 – 15:20"
              :class="inputClasses('examTime')"
            />
          </div>
          <div class="sm:col-span-2">
            <label :class="labelClass">Imtihon joyi <span class="text-danger">*</span></label>
            <input
              v-model="form.examPlace"
              type="text"
              maxlength="300"
              placeholder="Navoi xalqaro aeroporti, (PQAQTX xonasida)"
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
        <div>
          <label :class="labelClass">
            Imtihon tartibi — название курса в кавычках <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.courseTitle"
            type="text"
            maxlength="200"
            placeholder="Aviatsiya xavfsizligi"
            :class="inputClasses('courseTitle')"
          />
          <p class="mt-1 text-xs text-slate-500">
            «{{ form.courseTitle || "…" }}» oʻquv kursi boʻyicha {{ info?.groupCode || "…" }} guruhi
            tinglovchilarining yakuniy imtihonini oʻtkazish
          </p>
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
            maxlength="200"
            placeholder="2026-yil 2-oktabrdagi 43-son"
            :class="inputClasses('order')"
          />
          <p class="mt-1 text-xs text-slate-500">
            …MChJning {{ form.order || "…" }} buyrugʻi bilan tasdiqlangan…
          </p>
        </div>

        <div>
          <label :class="labelClass">
            Председатель (Komissiya raisi) <span class="text-danger">*</span>
          </label>
          <div :class="personGridClass">
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
          <label class="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-200">
            <input
              v-model="form.hasDeputy"
              type="checkbox"
              class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary dark:border-strokedark dark:bg-boxdark"
            />
            Заместитель председателя (Komissiya raisi oʻrinbosari)
          </label>
          <div v-if="form.hasDeputy" :class="[personGridClass, 'mt-2']">
            <input
              v-model="form.deputy.fullName"
              type="text"
              maxlength="100"
              placeholder="X.M. Yunusov"
              :class="inputClasses('deputy.fullName')"
            />
            <input
              v-model="form.deputy.position"
              type="text"
              maxlength="300"
              placeholder="Должность: instruktor-oʻqituvchi"
              :class="inputClasses('deputy.position')"
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
                  placeholder="O.M. Xujanov"
                  :class="inputClasses(`members.${index}.fullName`)"
                />
                <input
                  v-model="member.position"
                  type="text"
                  maxlength="300"
                  placeholder="Должность: Navoiy xalqaro aeroporti maʼmuriyati vakili, xizmat boshligʻi"
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
              placeholder="4"
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
              placeholder="4"
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
            placeholder="Kashayev R.D., Yunusov X.M., Xujanov O.M., Djurayev Sh.K."
            :class="inputClasses('commissionList')"
          />
        </div>
      </section>

      <!-- Председательствующий -->
      <section class="space-y-3">
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

interface ProtocolInfo {
  groupCode: string;
  courseName: string;
  /** Краткое название курса — значение по умолчанию для «Imtihon tartibi» */
  courseTitle: string;
  studentsCount: number;
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

const sectionClass = "text-sm font-bold text-slate-900 dark:text-white";
const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";
const personGridClass = "grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-2";
const inputClass =
  "w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3.5 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800";

const emptyPerson = (): FinalExamProtocolPerson => ({ fullName: "", position: "" });

const form = ref({
  date: "",
  number: "",
  place: "",
  examForm: "",
  examTime: "",
  examPlace: "",
  videoRecorded: true,
  courseTitle: "",
  order: "",
  chairman: emptyPerson(),
  hasDeputy: false,
  deputy: emptyPerson(),
  members: [emptyPerson()],
  approvedMembers: "" as number | "",
  presentMembers: "" as number | "",
  commissionList: "",
  presiding: emptyPerson(),
});
const info = ref<ProtocolInfo | null>(null);
const invalid = ref<string[]>([]);
const errorMessage = ref("");

// Последние введённые значения запоминаются в браузере — их не нужно набирать заново для
// следующей группы. Не запоминается то, что у каждого протокола своё: дата, номер
// (прошлый номер только показывается подсказкой) и название курса (оно берётся из группы).
const STORAGE_KEY = "atc_final_exam_protocol_form";
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
      examForm: text(saved.examForm),
      examTime: text(saved.examTime),
      examPlace: text(saved.examPlace),
      videoRecorded: saved.videoRecorded !== false,
      order: text(saved.order),
      chairman: person(saved.chairman),
      hasDeputy: saved.hasDeputy === true,
      deputy: person(saved.deputy),
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
    info.value = await authFetch<ProtocolInfo>(
      `/api/groups/${props.groupId}/final-exam-protocol-info`,
    );
    if (!form.value.courseTitle) form.value.courseTitle = info.value.courseTitle;
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

  const result: FinalExamProtocolForm = {
    date: required("date", value.date),
    number: required("number", clean(value.number)),
    place: required("place", clean(value.place)),
    presiding: requiredPerson("presiding", value.presiding),
    approvedMembers: count("approvedMembers", value.approvedMembers),
    presentMembers: count("presentMembers", value.presentMembers),
    examForm: required("examForm", clean(value.examForm)),
    examTime: required("examTime", clean(value.examTime)),
    examPlace: required("examPlace", clean(value.examPlace)),
    videoRecorded: value.videoRecorded,
    courseTitle: required("courseTitle", clean(value.courseTitle)),
    commissionList: required("commissionList", clean(value.commissionList)),
    order: required("order", clean(value.order)),
    chairman: requiredPerson("chairman", value.chairman),
    deputy: value.hasDeputy ? requiredPerson("deputy", value.deputy) : null,
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
