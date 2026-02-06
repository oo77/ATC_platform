<template>
  <CertificateUploadWrapper
    :organization-id="organizationId"
    :permissions="permissions"
    :representative="representative"
  />
</template>

<script setup>
/**
 * CertificateUploadTab - Таб загрузки сертификатов
 *
 * Это обёртка, которая предоставляет выбор между:
 * - AI импорт (автоматическое распознавание сертификатов)
 * - Ручная загрузка (классический ввод данных)
 */
import CertificateUploadWrapper from "./CertificateUploadWrapper.vue";

defineProps({
  organizationId: {
    type: String,
    required: true,
  },
  permissions: {
    type: Object,
    required: true,
  },
  representative: {
    type: Object,
    default: null,
  },
});
</script>
