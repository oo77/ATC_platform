<template>
  <Teleport to="body">
    <!-- Backdrop с анимацией -->
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isVisible"
        class="fixed inset-0 z-999999 flex items-center justify-center bg-black/80 px-4 py-5"
      >
        <!-- Модальное окно с анимацией -->
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 scale-95 -translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 -translate-y-4"
        >
          <div
            v-if="isVisible"
            class="w-full max-w-4xl rounded-2xl bg-white dark:bg-boxdark shadow-2xl overflow-hidden"
            @click.stop
          >
            <!-- Заголовок -->
            <div class="border-b border-stroke px-8 py-5 dark:border-strokedark flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-xl bg-primary/10 text-primary">
                  <UserIcon class="w-6 h-6" />
                </div>
                <h3 class="text-xl font-bold text-black dark:text-white uppercase tracking-tight">
                  {{ isEditMode ? 'Редактировать' : 'Добавить' }} инструктора
                </h3>
              </div>
              <button
                @click="handleClose"
                class="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-600 transition-all"
              >
                <XIcon class="w-6 h-6" />
              </button>
            </div>

            <!-- Tabs Navigation -->
            <div class="px-8 pt-4 border-b border-stroke dark:border-strokedark bg-slate-50/50 dark:bg-slate-800/20">
              <div class="flex gap-6">
                <button 
                  v-for="tab in formTabs" 
                  :key="tab.id"
                  @click="activeFormTab = tab.id"
                  class="pb-4 text-sm font-bold transition-all relative"
                  :class="activeFormTab === tab.id ? 'text-primary' : 'text-slate-400 hover:text-slate-600'"
                >
                  {{ tab.label }}
                  <div v-if="activeFormTab === tab.id" class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></div>
                </button>
              </div>
            </div>

            <!-- Форма -->
            <form @submit.prevent="handleSubmit" class="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              
              <!-- TAB 1: Основная информация -->
              <div v-show="activeFormTab === 'general'" class="space-y-6">
                <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <!-- Фото (Base64) -->
                  <div class="sm:col-span-2 flex flex-col items-center sm:flex-row gap-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                    <div class="relative group">
                      <div class="w-24 h-24 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-md">
                        <img v-if="formData.photo_base64" :src="formData.photo_base64" class="w-full h-full object-cover" />
                        <UserIcon v-else class="w-10 h-10 text-slate-400" />
                      </div>
                      <label class="absolute -bottom-2 -right-2 p-2 bg-primary text-white rounded-xl shadow-lg cursor-pointer hover:scale-110 transition-transform">
                        <CameraIcon class="w-4 h-4" />
                        <input type="file" class="hidden" accept="image/*" @change="handlePhotoUpload" />
                      </label>
                      <button v-if="formData.photo_base64" @click="formData.photo_base64 = ''" class="absolute -top-2 -left-2 p-1.5 bg-danger text-white rounded-lg shadow-lg hover:scale-110 transition-transform">
                        <Trash2Icon class="w-3 h-3" />
                      </button>
                    </div>
                    <div class="flex-1 text-center sm:text-left">
                      <h4 class="font-bold text-slate-900 dark:text-white mb-1">Фотография профиля</h4>
                      <p class="text-xs text-slate-500">Рекомендуется квадратное изображение, макс. 2МБ</p>
                    </div>
                  </div>

                  <!-- ФИО -->
                  <div class="sm:col-span-2">
                    <label class="mb-2.5 block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      ФИО <span class="text-danger">*</span>
                    </label>
                    <input
                      v-model="formData.fullName"
                      type="text"
                      placeholder="Введите полное имя"
                      class="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all dark:border-slate-700 dark:bg-slate-800/50"
                      :class="{ 'border-danger': errors.fullName }"
                      required
                    />
                  </div>

                  <!-- Email -->
                  <div>
                    <label class="mb-2.5 block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Email
                    </label>
                    <input
                      v-model="formData.email"
                      type="email"
                      placeholder="email@example.com"
                      class="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-5 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800/50"
                    />
                  </div>

                  <!-- Телефон -->
                  <div>
                    <label class="mb-2.5 block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Номер телефона
                    </label>
                    <input
                      v-model="formData.phone"
                      type="tel"
                      placeholder="+998901234567"
                      class="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-5 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800/50"
                    />
                  </div>

                  <!-- Прием на работу -->
                  <div>
                    <label class="mb-2.5 block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Прием на работу
                    </label>
                    <input
                      v-model="formData.hireDate"
                      type="date"
                      class="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-5 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800/50"
                    />
                  </div>

                  <!-- Контрактные данные -->
                  <div>
                    <label class="mb-2.5 block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Контрактные данные
                    </label>
                    <input
                      v-model="formData.contractInfo"
                      type="text"
                      placeholder="Номер и дата контракта"
                      class="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-5 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800/50"
                    />
                  </div>

                  <!-- Дата рождения -->
                  <div>
                    <label class="mb-2.5 block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Дата рождения
                    </label>
                    <input
                      v-model="formData.birthDate"
                      type="date"
                      class="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-5 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800/50"
                    />
                  </div>

                  <!-- Паспортные данные -->
                  <div>
                    <label class="mb-2.5 block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Паспортные данные
                    </label>
                    <input
                      v-model="formData.passportData"
                      type="text"
                      placeholder="Серия и номер"
                      class="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-5 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800/50"
                    />
                  </div>

                  <!-- Максимальные часы -->
                  <div>
                    <label class="mb-2.5 block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Лимит часов (мес)
                    </label>
                    <input
                      v-model.number="formData.maxHours"
                      type="number"
                      min="0"
                      class="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-5 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800/50"
                    />
                  </div>
                </div>

                <!-- Статус и Аккаунт -->
                <div class="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 space-y-4">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-bold text-slate-700 dark:text-slate-300">Статус активности</span>
                    <UiSwitch v-model="formData.isActive" />
                  </div>

                  <div v-if="!isEditMode" class="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div class="flex items-center justify-between mb-4">
                      <span class="text-sm font-bold text-slate-700 dark:text-slate-300">Создать учётную запись</span>
                      <UiSwitch v-model="formData.createAccount" />
                    </div>
                    <div v-if="formData.createAccount" class="grid grid-cols-1 gap-4 sm:grid-cols-2 animate-in fade-in slide-in-from-top-2">
                      <div>
                        <label class="mb-2 block text-xs font-bold text-slate-500">Пароль <span class="text-danger">*</span></label>
                        <input v-model="formData.accountPassword" type="password" class="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-sm outline-none focus:border-primary" />
                      </div>
                    </div>
                  </div>
                  
                  <!-- Смена пароля -->
                  <div v-if="isEditMode && props.instructor?.userId" class="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div class="flex items-center justify-between mb-4">
                      <span class="text-sm font-bold text-slate-700 dark:text-slate-300">Изменить пароль</span>
                      <UiSwitch v-model="formData.changePassword" />
                    </div>
                    <div v-if="formData.changePassword" class="grid grid-cols-1 gap-4 sm:grid-cols-2 animate-in fade-in slide-in-from-top-2">
                      <input v-model="formData.newPassword" type="password" placeholder="Новый пароль" class="rounded-xl border border-slate-200 py-2.5 px-4 text-sm outline-none focus:border-primary" />
                      <input v-model="formData.confirmNewPassword" type="password" placeholder="Повторите пароль" class="rounded-xl border border-slate-200 py-2.5 px-4 text-sm outline-none focus:border-primary" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- TAB 2: Квалификация -->
              <div v-show="activeFormTab === 'qualification'" class="space-y-6 animate-in fade-in duration-300">
                <div class="flex items-center justify-between">
                  <h4 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">Образование и квалификация</h4>
                  <UiButton variant="outline" size="sm" @click="addEducationRow" class="h-9 gap-2">
                    <PlusIcon class="w-4 h-4" /> Добавить ВУЗ
                  </UiButton>
                </div>

                <div v-if="formData.education_history.length === 0" class="text-center py-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                  <SchoolIcon class="w-12 h-12 text-slate-200 mx-auto mb-2" />
                  <p class="text-sm text-slate-400">Сведения об образовании пока не добавлены</p>
                </div>

                <div v-else class="space-y-6">
                  <div v-for="(edu, index) in formData.education_history" :key="index" class="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 relative">
                    <button @click="removeEducationRow(index)" class="absolute top-4 right-4 p-1 text-slate-400 hover:text-danger transition-colors">
                      <Trash2Icon class="w-4 h-4" />
                    </button>
                    
                    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <!-- Уровень образования -->
                      <div>
                        <label class="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Уровень образования
                        </label>
                        <select
                          v-model="edu.education"
                          class="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800"
                        >
                          <option value="">Выберите уровень</option>
                          <option value="Высшее">Высшее</option>
                          <option value="Магистратура">Магистратура</option>
                          <option value="Средне-специальное">Средне-специальное</option>
                          <option value="Доктор философии (PhD)">Доктор философии (PhD)</option>
                        </select>
                      </div>

                      <!-- ВУЗ -->
                      <div>
                        <label class="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Учебное заведение
                        </label>
                        <input
                          v-model="edu.university"
                          type="text"
                          placeholder="Название ВУЗа"
                          class="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800"
                        />
                      </div>

                      <!-- Специальность -->
                      <div class="sm:col-span-2">
                        <label class="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Специальность
                        </label>
                        <input
                          v-model="edu.specialty"
                          type="text"
                          placeholder="По диплому"
                          class="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800"
                        />
                      </div>

                      <!-- Серия и Номер диплома -->
                      <div class="grid grid-cols-2 gap-4 sm:col-span-2">
                        <div>
                          <label class="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Серия диплома
                          </label>
                          <input
                            v-model="edu.diploma_series"
                            type="text"
                            placeholder="Напр: B"
                            class="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800"
                          />
                        </div>
                        <div>
                          <label class="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Номер диплома
                          </label>
                          <input
                            v-model="edu.diploma_number"
                            type="text"
                            placeholder="Напр: 123456"
                            class="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800"
                          />
                        </div>
                      </div>

                      <!-- Годы обучения -->
                      <div class="grid grid-cols-2 gap-4 sm:col-span-2">
                        <div>
                          <label class="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Год начала
                          </label>
                          <input
                            v-model.number="edu.year_start"
                            type="number"
                            min="1950"
                            :max="new Date().getFullYear()"
                            placeholder="2010"
                            class="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800"
                          />
                        </div>
                        <div>
                          <label class="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Год окончания
                          </label>
                          <input
                            v-model.number="edu.year_end"
                            type="number"
                            min="1950"
                            :max="new Date().getFullYear() + 10"
                            placeholder="2015"
                            class="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800"
                          />
                        </div>
                      </div>

                      <!-- Диплом (Файлы) -->
                      <div class="sm:col-span-2">
                        <label class="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Сканы диплома
                        </label>
                        <FileUploader
                          category="instructor_diploma"
                          :multiple="true"
                          @uploaded="(file) => handleDiplomaUpload(index, file)"
                          @deleted="(uuid: string) => edu.diploma_file_ids = (edu.diploma_file_ids || []).filter((id: string) => id !== uuid)"
                          :initial-files="getInitialEduFiles(edu)"
                          class="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <!-- Учёная степень -->
                    <div>
                      <label class="mb-2.5 block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Учёная степень
                      </label>
                      <input
                        v-model="formData.academic_degree"
                        type="text"
                        placeholder="Например: Кандидат техн. наук"
                        class="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-5 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800/50"
                      />
                    </div>

                    <!-- Учёное звание -->
                    <div>
                      <label class="mb-2.5 block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Учёное звание
                      </label>
                      <input
                        v-model="formData.academic_rank"
                        type="text"
                        placeholder="Например: Доцент"
                        class="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-5 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800/50"
                      />
                    </div>

                    <!-- Языки -->
                    <div class="sm:col-span-2">
                      <label class="mb-2.5 block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Знание языков
                      </label>
                      <UiMultiSelect
                        v-model="formData.languages"
                        :options="languageOptions"
                        placeholder="Выберите языки"
                        class="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1 px-5 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800/50"
                      />
                    </div>
                  </div>
                </div>
              </div>



              <!-- TAB: Опыт работы -->
              <div v-show="activeFormTab === 'experience'" class="space-y-6 animate-in fade-in duration-300">
                <div class="flex items-center justify-between">
                  <h4 class="text-sm font-bold text-slate-900 dark:text-white">Опыт работы</h4>
                  <UiButton variant="outline" size="sm" @click="addExperienceRow" class="h-9 gap-2">
                    <PlusIcon class="w-4 h-4" /> Добавить место работы
                  </UiButton>
                </div>

                <div v-if="formData.work_experience.length === 0" class="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl">
                  <BookOpenIcon class="w-12 h-12 text-slate-200 mx-auto mb-2" />
                  <p class="text-sm text-slate-400">Опыт работы пока не указан</p>
                </div>

                <div v-else class="space-y-4">
                  <div v-for="(exp, index) in formData.work_experience" :key="index" class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 relative">
                    <button @click="removeExperienceRow(index)" class="absolute top-4 right-4 p-1 text-slate-400 hover:text-danger">
                      <Trash2Icon class="w-4 h-4" />
                    </button>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div class="sm:col-span-2">
                        <label class="text-xs font-bold text-slate-500 mb-1.5 block">Организация / Работодатель</label>
                        <input v-model="exp.employer" type="text" placeholder="Название компании" class="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm" />
                      </div>
                      <div>
                        <label class="text-xs font-bold text-slate-500 mb-1.5 block">Должность</label>
                        <input v-model="exp.position" type="text" placeholder="Ваша роль" class="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm" />
                      </div>
                      <div>
                        <label class="text-xs font-bold text-slate-500 mb-1.5 block">Период работы / Годы</label>
                        <input v-model="exp.period" type="text" placeholder="Напр: 2018 - 2022 или 5 лет" class="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- TAB 3: Сертификаты -->
              <div v-show="activeFormTab === 'certificates'" class="space-y-6 animate-in fade-in duration-300">
                <div class="flex items-center justify-between">
                  <h4 class="text-sm font-bold text-slate-900 dark:text-white">Список сертификатов</h4>
                  <UiButton variant="outline" size="sm" @click="addCertificateRow" class="h-9 gap-2">
                    <PlusIcon class="w-4 h-4" /> Добавить
                  </UiButton>
                </div>

                <div v-if="formData.certificates.length === 0" class="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl">
                  <AwardIcon class="w-12 h-12 text-slate-200 mx-auto mb-2" />
                  <p class="text-sm text-slate-400">Сертификаты пока не добавлены</p>
                </div>

                <div v-else class="space-y-4">
                  <div v-for="(cert, index) in formData.certificates" :key="index" class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 relative">
                    <button @click="removeCertificateRow(index)" class="absolute top-4 right-4 p-1 text-slate-400 hover:text-danger">
                      <XIcon class="w-4 h-4" />
                    </button>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div class="sm:col-span-2">
                        <label class="text-xs font-bold text-slate-500 mb-1.5 block">Название сертификата</label>
                        <input v-model="cert.name" type="text" class="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm" />
                      </div>
                      <div>
                        <label class="text-xs font-bold text-slate-500 mb-1.5 block">Серия сертификата</label>
                        <input v-model="cert.series" type="text" placeholder="Напр: AT" class="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm" />
                      </div>
                      <div>
                        <label class="text-xs font-bold text-slate-500 mb-1.5 block">Номер сертификата</label>
                        <input v-model="cert.certificate_number" type="text" placeholder="Напр: 00123" class="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm" />
                      </div>
                      <div>
                        <label class="text-xs font-bold text-slate-500 mb-1.5 block">Дата получения</label>
                        <input v-model="cert.date" type="date" class="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm" />
                      </div>
                      <div class="sm:col-span-2">
                        <label class="text-xs font-bold text-slate-500 mb-1.5 block">Прикрепить скан</label>
                        <FileUploader
                          category="instructor_certificate"
                          :max-size-mb="10"
                          @uploaded="(file) => { cert.fileId = file.uuid; certificateFilesMap[file.uuid] = file; }"
                          @deleted="() => cert.fileId = ''"
                          :show-preview="true"
                          :initial-files="getInitialCertFile(cert)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- TAB 4: Доп. файлы -->
              <div v-show="activeFormTab === 'files'" class="space-y-6 animate-in fade-in duration-300">
                <div class="sm:col-span-2">
                  <label class="mb-2.5 block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Дополнительные документы
                  </label>
                  <FileUploader
                    category="instructor_additional"
                    :multiple="true"
                    @uploaded="handleAdditionalFileUpload"
                    @deleted="(uuid: string) => formData.additional_files = formData.additional_files.filter((id: string) => id !== uuid)"
                    :initial-files="additionalFilesList"
                    class="mt-1"
                  />
                </div>
              </div>

              <!-- Кнопки -->
              <div class="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <UiButton
                  variant="outline"
                  @click="handleClose"
                  :disabled="loading"
                  class="h-11 px-8 rounded-xl font-bold"
                >
                  Отмена
                </UiButton>
                <UiButton
                  variant="success"
                  type="submit"
                  :loading="loading"
                  class="h-11 px-8 rounded-xl font-bold shadow-lg shadow-success/20"
                >
                  {{ isEditMode ? 'Сохранить изменения' : 'Добавить инструктора' }}
                </UiButton>
              </div>
            </form>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import type { Instructor, UpdateInstructorInput, InstructorCertificate } from '~/types/instructor';
import { 
  User as UserIcon, 
  X as XIcon, 
  Camera as CameraIcon, 
  Plus as PlusIcon, 
  Award as AwardIcon, 
  Trash2 as Trash2Icon,
  BookOpen as BookOpenIcon,
  GraduationCap as GraduationCapIcon,
  FileText as FileTextIcon,
  School as SchoolIcon
} from 'lucide-vue-next';
import FileUploader from '~/components/common/FileUploader.vue';
import UiSwitch from '~/components/ui/Switch.vue';
import UiMultiSelect from '~/components/ui/MultiSelect.vue';
import UiButton from '~/components/ui/Button.vue';

interface Props {
  instructor: Instructor | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

// Состояние
const loading = ref(false);
const isVisible = ref(false);
const activeFormTab = ref('general');
const errors = reactive<Record<string, string[]>>({});
const notification = useNotification();
const { getFilesByUuids } = useFileManager();

// Файлы для предпросмотра
const additionalFilesList = ref<any[]>([]);
const certificateFilesMap = ref<Record<string, any>>({});
const educationFilesMap = ref<Record<string, any>>({});

const formTabs = [
  { id: 'general', label: 'Основные' },
  { id: 'qualification', label: 'Квалификация' },
  { id: 'experience', label: 'Опыт работы' },
  { id: 'certificates', label: 'Сертификаты' },
  { id: 'files', label: 'Файлы' }
];

const languageOptions = [
  { label: 'Узбекский', id: 'uz' },
  { label: 'Русский', id: 'ru' },
  { label: 'Английский', id: 'en' },
  { label: 'Немецкий', id: 'de' }
];

// Данные формы
const formData = reactive({
  fullName: '',
  email: '',
  phone: '',
  hireDate: '',
  contractInfo: '',
  maxHours: 0,
  isActive: true,
  
  // New qualification fields
  birthDate: null as string | null,
  passportData: '',
  education: '',
  university: '',
  diploma_file_ids: [] as string[],
  specialty: '',
  academic_degree: '',
  academic_rank: '',
  education_history: [] as any[],
  work_experience: [] as any[],
  certificates: [] as InstructorCertificate[],
  languages: [] as string[],
  photo_base64: null as string | null,
  additional_files: [] as string[],

  // Поля для создания учётной записи (новый инструктор)
  createAccount: false,
  accountPassword: '',
  // Поля для смены пароля (редактирование инструктора с аккаунтом)
  changePassword: false,
  newPassword: '',
  confirmNewPassword: '',
});

// Вспомогательная функция для форматирования даты
const formatDateForInputLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Вычисляемые свойства
const isEditMode = computed(() => !!props.instructor);

// Методы
const handleClose = () => {
  isVisible.value = false;
  setTimeout(() => {
    emit('close');
  }, 300);
};

const handlePhotoUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    notification.error('Файл слишком большой (макс 2МБ)');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    formData.photo_base64 = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

const addCertificateRow = () => {
  formData.certificates.push({ name: '', date: '', series: '', certificate_number: '', fileId: '' });
};

const removeCertificateRow = (index: number) => {
  formData.certificates.splice(index, 1);
};

const handleAdditionalFileUpload = (file: any) => {
  formData.additional_files.push(file.uuid);
};

const addEducationRow = () => {
  formData.education_history.push({ 
    education: '', 
    university: '', 
    specialty: '', 
    diploma_series: '',
    diploma_number: '',
    year_start: null,
    year_end: null,
    diploma_file_ids: [] 
  });
};

const removeEducationRow = (index: number) => {
  formData.education_history.splice(index, 1);
};

const addExperienceRow = () => {
  formData.work_experience.push({ employer: '', position: '', period: '' });
};

const removeExperienceRow = (index: number) => {
  formData.work_experience.splice(index, 1);
};

const handleDiplomaUpload = (index: number, file: any) => {
  if (!formData.education_history[index].diploma_file_ids) {
    formData.education_history[index].diploma_file_ids = [];
  }
  formData.education_history[index].diploma_file_ids.push(file.uuid);
  educationFilesMap.value[file.uuid] = file;
};

const getInitialEduFiles = (edu: any) => {
  if (!edu.diploma_file_ids?.length) return [];
  return edu.diploma_file_ids.map((uuid: string) => educationFilesMap.value[uuid]).filter(Boolean);
};

const getInitialCertFile = (cert: InstructorCertificate) => {
  if (!cert.fileId) return [];
  const file = certificateFilesMap.value[cert.fileId];
  return file ? [file] : [];
};

// Загрузка метаданных файлов
const fetchFileMetadata = async () => {
  const educationFileIds = formData.education_history.flatMap(edu => edu.diploma_file_ids || []);
  const allUuids = [
    ...educationFileIds,
    ...(formData.additional_files || []),
    ...(formData.certificates?.map(c => c.fileId).filter(Boolean) as string[] || [])
  ];

  if (allUuids.length === 0) return;

  try {
    const files = await getFilesByUuids(allUuids);
    
    // Распределяем файлы
    additionalFilesList.value = files.filter(f => formData.additional_files?.includes(f.uuid));
    
    // Карта для сертификатов
    files.forEach(f => {
      certificateFilesMap.value[f.uuid] = f;
      if (educationFileIds.includes(f.uuid)) {
        educationFilesMap.value[f.uuid] = f;
      }
    });
  } catch (error) {
    console.error('Error fetching file metadata:', error);
  }
};

const handleSubmit = async () => {
  if (loading.value) return;
  
  // Очистка ошибок
  Object.keys(errors).forEach((key) => delete errors[key]);

  // Простая валидация
  if (!formData.fullName.trim()) {
    notification.error('ФИО обязательно для заполнения');
    return;
  }

  // Проверка совпадения паролей
  if (isEditMode.value && formData.changePassword) {
    if (!formData.newPassword) {
      notification.error('Введите новый пароль');
      return;
    }
    if (formData.newPassword !== formData.confirmNewPassword) {
      notification.error('Пароли не совпадают');
      return;
    }
  }

  loading.value = true;

  try {
    const endpoint = isEditMode.value ? `/api/instructors/${props.instructor!.id}` : '/api/instructors';
    const method = isEditMode.value ? 'PUT' : 'POST';

    const payload: any = {
      fullName: formData.fullName,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      hireDate: formData.hireDate || undefined,
      contractInfo: formData.contractInfo || undefined,
      maxHours: formData.maxHours,
      isActive: formData.isActive,
      
      // New fields
      birthDate: formData.birthDate || null,
      passportData: formData.passportData || null,
      education: formData.education || null,
      university: formData.university || null,
      diploma_file_ids: formData.diploma_file_ids.length > 0 ? formData.diploma_file_ids : null,
      specialty: formData.specialty || null,
      academic_degree: formData.academic_degree || null,
      academic_rank: formData.academic_rank || null,
      education_history: formData.education_history.filter(e => e.education || e.university).length > 0 
        ? formData.education_history.filter(e => e.education || e.university) 
        : null,
      work_experience: formData.work_experience.filter(e => e.employer || e.position).length > 0 
        ? formData.work_experience.filter(e => e.employer || e.position) 
        : null,
      certificates: formData.certificates.filter(c => c.name).length > 0 ? formData.certificates.filter(c => c.name) : null,
      languages: formData.languages.length > 0 ? formData.languages : null,
      photo_base64: formData.photo_base64 || null,
      additional_files: formData.additional_files.length > 0 ? formData.additional_files : null,
    };

    console.log('[InstructorFormModal] Sending payload:', payload);

    if (isEditMode.value) {
      if (formData.changePassword) {
        payload.changePassword = true;
        payload.newPassword = formData.newPassword;
      }
    } else {
      payload.createAccount = formData.createAccount;
      payload.accountPassword = formData.accountPassword;
    }

    const { authFetch } = useAuthFetch();
    const response = await authFetch<{ success: boolean; message?: string }>(endpoint, {
      method,
      body: payload
    });

    if (response.success) {
      notification.success(isEditMode.value ? 'Инструктор обновлен' : 'Инструктор создан');
      emit('saved');
      handleClose();
    } else {
      notification.error(response.message || 'Ошибка сохранения');
    }
  } catch (error: any) {
    console.error('Error saving instructor:', error);
    notification.error(error.data?.message || 'Ошибка при сохранении');
  } finally {
    loading.value = false;
  }
};

// Инициализация формы при редактировании
onMounted(() => {
  setTimeout(() => {
    isVisible.value = true;
  }, 50);

  if (props.instructor) {
    formData.fullName = props.instructor.fullName;
    formData.email = props.instructor.email || '';
    formData.phone = props.instructor.phone || '';
    formData.hireDate = props.instructor.hireDate 
      ? (typeof props.instructor.hireDate === 'string' 
        ? props.instructor.hireDate.split('T')[0]!
        : formatDateForInputLocal(new Date(props.instructor.hireDate)))
      : '';
    formData.contractInfo = props.instructor.contractInfo || '';
    formData.maxHours = props.instructor.maxHours || 0;
    formData.isActive = props.instructor.isActive;
    
    // Set new fields if they exist
    formData.birthDate = props.instructor.birthDate
      ? (typeof props.instructor.birthDate === 'string' 
        ? props.instructor.birthDate.split('T')[0]!
        : formatDateForInputLocal(new Date(props.instructor.birthDate)))
      : null;
    formData.passportData = props.instructor.passportData || '';
    formData.education = props.instructor.education || '';
    formData.university = props.instructor.university || '';
    formData.diploma_file_ids = Array.isArray(props.instructor.diploma_file_ids) ? [...props.instructor.diploma_file_ids] : [];
    formData.specialty = props.instructor.specialty || '';
    formData.academic_degree = props.instructor.academic_degree || '';
    formData.academic_rank = props.instructor.academic_rank || '';
    
    // Initialize education history
    if (Array.isArray(props.instructor.education_history) && props.instructor.education_history.length > 0) {
      formData.education_history = props.instructor.education_history.map((edu: any) => ({
        ...edu,
        // migrate old date_start/date_end to year format
        year_start: edu.year_start ?? (edu.date_start ? new Date(edu.date_start).getFullYear() : null),
        year_end: edu.year_end ?? (edu.date_end ? new Date(edu.date_end).getFullYear() : null),
      }));
    } else if (props.instructor.education || props.instructor.university) {
      // Fallback for legacy data
      formData.education_history = [{
        education: props.instructor.education || '',
        university: props.instructor.university || '',
        specialty: props.instructor.specialty || '',
        diploma_series: '',
        diploma_number: '',
        year_start: null,
        year_end: null,
        diploma_file_ids: Array.isArray(props.instructor.diploma_file_ids) ? [...props.instructor.diploma_file_ids] : []
      }];
    } else {
      formData.education_history = [];
    }

    formData.work_experience = Array.isArray(props.instructor.work_experience) ? [...props.instructor.work_experience] : [];

    formData.certificates = Array.isArray(props.instructor.certificates) ? [...props.instructor.certificates] : [];
    formData.languages = Array.isArray(props.instructor.languages) ? [...props.instructor.languages] : [];
    formData.photo_base64 = props.instructor.photo_base64 || null;
    formData.additional_files = Array.isArray(props.instructor.additional_files) ? [...props.instructor.additional_files] : [];

    // Fetch files metadata for preview
    fetchFileMetadata();
  }
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #334155;
}
</style>
