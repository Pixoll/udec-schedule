<script setup lang="ts">
import api, { type Schedule } from "@/api";
import ScheduleScreen from "@/components/ScheduleScreen.vue";
import SvgSpinner from "@/components/SvgSpinner.vue";
import { onMounted, ref } from "vue";

const loading = ref(true);
const error = ref<string>();
const schedule = ref<Schedule>();

onMounted(async () => {
  try {
    const result = await api.getSchedule();

    if (result.error) {
      console.log(result.error);
    } else {
      schedule.value = result.data;
    }
  } catch (e) {
    console.error(e);
    error.value = `${e as Error}`;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <main>
    <div v-if="loading" class="flex h-screen w-screen gap-2 items-center justify-center">
      <SvgSpinner class="size-6"/>
      <span>Cargando...</span>
    </div>
    <div v-else-if="error" class="flex h-screen w-screen items-center justify-center">
      <span class="text-red-500">{{ error }}. Por favor intenta de nuevo más tarde.</span>
    </div>
    <div v-else-if="!schedule" class="flex h-screen w-screen items-center justify-center">
      <span class="text-red-500">No se pudo obtener los horarios. Por favor intenta de nuevo más tarde.</span>
    </div>
    <ScheduleScreen v-else :schedule="schedule"/>
  </main>
</template>
