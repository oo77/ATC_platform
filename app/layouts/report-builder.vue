<template>
  <div class="flex h-screen overflow-hidden">
    <AppSidebar />
    <Backdrop />
    <div
      :class="[
        'flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out min-w-0',
        {
          'lg:ml-[290px]': isExpanded || isHovered,
          'lg:ml-[90px]': !isExpanded && !isHovered,
        },
      ]"
    >
      <div class="shrink-0">
        <AppHeader />
      </div>
      <!-- Контент занимает оставшуюся высоту, без padding, без max-width -->
      <div class="flex-1 min-h-0 overflow-hidden">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Layout для полноэкранных страниц с сайдбаром/хедером (без padding у main)
// Используется в Report Builder и других full-height редакторах
import AppHeader from "@/components/layout/AppHeader.vue";
import AppSidebar from "@/components/layout/AppSidebar.vue";
import Backdrop from "@/components/layout/Backdrop.vue";
import { useSidebar } from "~/composables/useSidebar";

const { isExpanded, isHovered } = useSidebar();
</script>
