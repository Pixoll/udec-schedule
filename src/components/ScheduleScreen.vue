<script setup lang="ts">
import type { ClassType, Schedule, Subject } from "@/api";
import { groupSubjects, SlotType } from "@/util/schedule.ts";
import { tw } from "@/util/tailwind.ts";
import { computed, reactive, ref } from "vue";

const { schedule } = defineProps<{
  schedule: Schedule;
}>();

const colors = [
  "#f44236",
  "#ff9700",
  "#4cb050",
  "#2196f3",
  "#3f51b5",
  "#9c45b0",
  "#a98273",
  "#a96214",
  "#af0039",
  "#34525d",
] as const;

const search = ref("");

const filteredSubjects = computed(() =>
  Object.values(schedule.schedules).filter(s =>
    `${s.code}-${s.section}`.includes(search.value)
    || removeAccents(s.name.toLowerCase()).includes(removeAccents(search.value.toLowerCase()))
  )
);

const selectedSubjects = reactive(new Set<Subject>());

const groupedSubjectsResult = computed(() => groupSubjects(selectedSubjects, colors));
const maxSlot = computed(() => groupedSubjectsResult.value.maxSlot);
const hasWeekendClasses = computed(() => groupedSubjectsResult.value.hasWeekendClasses);
const groupedSubjects = computed(() => groupedSubjectsResult.value.groupedSubjects);

const table = computed(() => Array.from({ length: maxSlot.value }, (_, i) => [
  groupedSubjects.value.get(`lu-${i + 1}`) ?? [],
  groupedSubjects.value.get(`ma-${i + 1}`) ?? [],
  groupedSubjects.value.get(`mi-${i + 1}`) ?? [],
  groupedSubjects.value.get(`ju-${i + 1}`) ?? [],
  groupedSubjects.value.get(`vi-${i + 1}`) ?? [],
  ...hasWeekendClasses.value ? [
    groupedSubjects.value.get(`sa-${i + 1}`) ?? [],
    groupedSubjects.value.get(`do-${i + 1}`) ?? [],
  ] : [],
]));

const days = computed(() => [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  ...hasWeekendClasses.value ? [
    "Sábado",
    "Domingo",
  ] : [],
]);

const classTypeToString = {
  t: "T",
  p: "P",
  l: "L",
  test: "TEST",
} as const satisfies Record<ClassType, string>;

const slotTypeToClass = {
  [SlotType.UNIQUE]: tw("rounded-lg h-[calc(100%-0.2rem)] my-0.5"),
  [SlotType.START]: tw("rounded-t-lg h-[calc(100%-0.1rem)] mt-0.5"),
  [SlotType.MIDDLE]: tw("h-full"),
  [SlotType.END]: tw("rounded-b-lg h-[calc(100%-0.1rem)] mb-0.5"),
} as const satisfies Record<SlotType, string>;

const gridWithWeekend = tw("[grid-template-columns:fit-content(0)_repeat(7,16rem)]");
const gridNoWeekend = tw("[grid-template-columns:fit-content(0)_repeat(5,16rem)]");

function removeAccents(text: string): string {
  // webstorm had a fucking stroke
  // noinspection JSVoidFunctionReturnValueUsed
  return text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

function onSearchChange(e: Event): void {
  // @ts-expect-error idk why value doesnt exist in the types
  search.value = e.target?.value ?? "";
}
</script>

<template>
  <div class="p-10">
    <h1 class="font-bold text-3xl mb-8">
      Arma tu horario UdeC
    </h1>

    <span v-if="schedule.updating" class="text-orange-400">
      Los horarios están siendo actualizados actualmente. Actualiza de nuevo la página en unos minutos más para
      obtener los nuevos horarios.
    </span>

    <div class="flex gap-16 mb-16">
      <div class="w-[800px]">
        <label for="subject-search" class="block w-fit mb-2">
          Buscar ramos
        </label>
        <input
          id="subject-search"
          class="block w-full mb-6"
          placeholder="Busca por código o nombre..."
          :value="search"
          @input="onSearchChange"
        />
        <ul v-if="filteredSubjects.length > 0" class="w-full max-h-96 p-4 space-y-4 overflow-y-scroll">
          <li v-for="subject in filteredSubjects" :key="`${subject.code}-${subject.section}`">
            <button
              type="button"
              class="size-7 mr-2 rounded-full bg-emerald-500 text-center content-center cursor-pointer"
              @click="() => selectedSubjects.add(subject)"
            >
              +
            </button>
            <pre class="inline mr-2">{{ subject.code }}-{{ subject.section }}</pre>
            {{ subject.name }}
          </li>
        </ul>
        <span v-else class="w-full p-4">
          Sin resultados.
        </span>
      </div>

      <div>
        <span class="block mb-4">
          Ramos agregados:
        </span>
        <ul class="max-h-96 p-4 space-y-4 overflow-y-scroll">
          <li v-for="subject in selectedSubjects" :key="`${subject.code}-${subject.section}`">
            <button
              type="button"
              class="size-7 mr-2 rounded-full bg-red-400 text-center content-center cursor-pointer"
              @click="() => selectedSubjects.delete(subject)"
            >
              -
            </button>
            <pre class="inline mr-2">{{ subject.code }}-{{ subject.section }}</pre>
            {{ subject.name }}
          </li>
        </ul>
      </div>
    </div>

    <div class="grid" :class="[hasWeekendClasses ? gridWithWeekend : gridNoWeekend]">
      <div></div>
      <div v-for="day in days" :key="day" class="h-8 content-center text-center">
        {{ day }}
      </div>

      <template v-for="(row, i) in table" :key="JSON.stringify(row)">
        <div class="grid h-32 px-2 gap-2 content-center text-center">
          <span>{{ i + 1 }}</span>
          <span class="text-gray-500 text-xs">{{ i + 8 }}:00 {{ i + 9 }}:00</span>
        </div>
        <div
          v-for="(subjects, j) in row" :key="JSON.stringify(subjects)"
          class="grid border-b-1 border-r-1 border-b-gray-300 border-r-gray-300 text-white text-wrap [word-break:break-word]"
          :class="{
            '!border-b-0': subjects.some(s => s.slotType === SlotType.START || s.slotType === SlotType.MIDDLE)
                           || i === table.length - 1,
            '!border-r-0': j === row.length - 1,
          }"
          :style="{ 'grid-template-columns': `repeat(${subjects.length}, 1fr)` }"
        >
          <div
            v-for="subject in subjects"
            :key="`${subject.code}-${subject.section}`"
            class="box-border mx-[0.1rem] p-2"
            :class="[slotTypeToClass[subject.slotType]]"
            :style="{ 'background-color': subject.backgroundColor }"
          >
            <template v-if="subject.slotType === SlotType.UNIQUE || subject.slotType === SlotType.START">
              <span class="block font-bold">
                {{ subject.code }}-{{ subject.section }} {{ subject.name }}
              </span>
              <span
                v-for="classroom in subject.classrooms"
                :key="JSON.stringify(classroom)"
                class="block mt-1  text-white/75"
              >
                [{{ classTypeToString[subject.type] }}{{ classroom.group ? ` G${classroom.group}` : "" }}]
                {{ classroom.classroom }}
              </span>
            </template>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
