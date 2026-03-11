<script lang="ts">
  import SubjectsList from "$lib/components/SubjectsList.svelte";
  import { groupSubjects, schedule, SlotType } from "$lib/schedule";
  import { tw } from "$lib/tailwind";
  import type { ClassType, Subject } from "@/api";
  import { SvelteSet } from "svelte/reactivity";

  const SUBJECTS_KEY = "subjects";

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

  let search = $state("");

  const selectedSubjects = new SvelteSet<Subject>(localStorage.getItem(SUBJECTS_KEY)?.split(",").map(code =>
    $schedule.schedules[code]
  ).filter<Subject>(s => !!s) ?? []);

  const filteredSubjects = $derived(Object.values($schedule.schedules).filter(s =>
      !selectedSubjects.has(s)
      && (
        `${s.code}-${s.section}`.includes(search)
        || isSubsequence(removeAccents(search.toLowerCase()), removeAccents(s.name.toLowerCase()))
      )
  ));

  const groupedSubjectsResult = $derived(groupSubjects(selectedSubjects, colors));
  const maxSlot = $derived(groupedSubjectsResult.maxSlot);
  const hasWeekendClasses = $derived(groupedSubjectsResult.hasWeekendClasses);
  const groupedSubjects = $derived(groupedSubjectsResult.groupedSubjects);

  const table = $derived(Array.from({ length: maxSlot }, (_, i) => [
    groupedSubjects.get(`lu-${i + 1}`) ?? [],
    groupedSubjects.get(`ma-${i + 1}`) ?? [],
    groupedSubjects.get(`mi-${i + 1}`) ?? [],
    groupedSubjects.get(`ju-${i + 1}`) ?? [],
    groupedSubjects.get(`vi-${i + 1}`) ?? [],
    ...hasWeekendClasses ? [
      groupedSubjects.get(`sa-${i + 1}`) ?? [],
      groupedSubjects.get(`do-${i + 1}`) ?? [],
    ] : [],
  ]));

  const days = $derived([
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    ...hasWeekendClasses ? [
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

  function isSubsequence(subsequence: string, sequence: string): boolean {
    let n = subsequence.length, m = sequence.length;
    let i = 0, j = 0;

    while (i < n && j < m) {
      if (subsequence[i] == sequence[j])
        i++;
      j++;
    }

    return i == n;
  }

  function addSubject(subject: Subject): void {
    selectedSubjects.add(subject);
    localStorage.setItem(SUBJECTS_KEY, [...selectedSubjects.values()].map(s => `${s.code}-${s.section}`).join(","));
  }

  function removeSubject(subject: Subject): void {
    selectedSubjects.delete(subject);
    localStorage.setItem(SUBJECTS_KEY, [...selectedSubjects.values()].map(s => `${s.code}-${s.section}`).join(","));
  }
</script>

<div class="p-10">
  <h1 class="font-bold text-3xl mb-8">
    Arma tu horario UdeC
  </h1>

  {#if $schedule.updating}
     <span class="text-orange-400">
       Los horarios están siendo actualizados actualmente. Actualiza de nuevo la página en unos minutos más para
       obtener los nuevos horarios.
     </span>
  {/if}

  <div class="mb-16 space-y-16">
    <div class="max-w-200">
      <SubjectsList
        subjects={filteredSubjects}
        type="add"
        action={addSubject}
        title="Buscar ramos"
        bind:searchValue={search}
        searchPlaceholder="Busca por código o nombre..."
        emptyText="Sin resultados."
      />
    </div>

    <div class="max-w-200">
      <SubjectsList subjects={selectedSubjects} type="remove" action={removeSubject} title="Ramos agregados"/>
    </div>
  </div>

  <div class={["grid", hasWeekendClasses ? gridWithWeekend : gridNoWeekend]}>
    <div></div>
    {#each days as day (day)}
      <div class="h-8 content-center text-center">
        {day}
      </div>
    {/each}

    {#each table as row, i (`${i}:${JSON.stringify(row)}`)}
      <div class="grid h-32 px-2 gap-2 content-center text-center">
        <span>{i + 1}</span>
        <span class="text-gray-500 text-xs">{i + 8}:00 {i + 9}:00</span>
      </div>

      {#each row as subjects, j (`${j}:${JSON.stringify(subjects)}`)}
        <div
          class={{
            "grid border-b border-r border-b-gray-300 border-r-gray-300 text-white text-wrap": true,
            "[word-break:break-word]": true,
            "border-b-0!": subjects.some(s => s.slotType === SlotType.START || s.slotType === SlotType.MIDDLE)
                           || i === table.length - 1,
            "border-r-0!": j === row.length - 1,
          }}
          style:grid-template-columns={`repeat(${subjects.length}, 1fr)`}
        >
          {#each subjects as subject (`${subject.code}-${subject.section}`)}
            <div
              class={["box-border mx-[0.1rem] p-2", slotTypeToClass[subject.slotType]]}
              style:background-color={subject.backgroundColor}
            >
              {#if subject.slotType === SlotType.UNIQUE || subject.slotType === SlotType.START}
                <span class="block font-bold">
                  {subject.code}-{subject.section} {subject.name}
                </span>
                {#each subject.classrooms as classroom (JSON.stringify(classroom))}
                  <span class="block mt-1  text-white/75">
                    [{classTypeToString[subject.type]}{classroom.group ? ` G${classroom.group}` : ""}]
                    {classroom.classroom}
                  </span>
                {/each}
              {/if}
            </div>
          {/each}
        </div>
      {/each}
    {/each}
  </div>
</div>
