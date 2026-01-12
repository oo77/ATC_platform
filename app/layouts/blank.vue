<template>
  <div class="blank-layout">
    <slot />
  </div>
</template>

<script setup lang="ts">
// Blank layout - без боковой панели и без стилей фона
// Используется для полноэкранных редакторов типа Certificate Editor
</script>

<style scoped>
.blank-layout {
  min-height: 100vh;
  width: 100%;
}
</style>
