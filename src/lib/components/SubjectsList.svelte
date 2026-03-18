<script lang="ts">
  import type { Subject } from "@/api";

  type Props = {
    subjects: Subject[] | Set<Subject>;
    type: "add" | "remove";
    action: (subject: Subject) => void;
    title: string;
    searchValue?: string;
    searchPlaceholder?: string;
    emptyText?: string;
  };

  type MinimizedState = Partial<Record<Props["type"], boolean>>;

  let { subjects, type, action, title, searchValue = $bindable(), searchPlaceholder, emptyText }: Props = $props();

  const MINIMIZED_KEY = "minimized";

  let minimizedState = $state(loadMinimizedState());
  let isCurrentMinimized = $derived(!!minimizedState[type]);

  function toggleMinimized(): void {
    const tempMinimizedState = loadMinimizedState();
    minimizedState = {
      ...tempMinimizedState,
      [type]: !tempMinimizedState[type],
    };
    localStorage.setItem(MINIMIZED_KEY, JSON.stringify(minimizedState));
  }

  function loadMinimizedState(): MinimizedState {
    return JSON.parse(localStorage.getItem(MINIMIZED_KEY) ?? "{}") as MinimizedState;
  }
</script>

<div class="mb-4">
  <button
    type="button"
    class="size-6 rounded-full select-none text-xl font-mono cursor-pointer bg-gray-300 content-center"
    onclick={toggleMinimized}
  >
    {isCurrentMinimized ? "+" : "-"}
  </button>

  {#if searchValue !== undefined}
    <label for="subject-search" class="w-fit font-medium">
      {title}
    </label>
    <input
      id="subject-search"
      class="block w-full mt-2"
      class:hidden={isCurrentMinimized}
      placeholder={searchPlaceholder}
      bind:value={searchValue}
    />
  {:else}
    <span class="font-medium">{title}</span>
  {/if}
</div>

{#if !emptyText || (Array.isArray(subjects) ? subjects.length : subjects.size) > 0}
  <ul class="w-full max-h-96 p-3 space-y-4 overflow-y-scroll" class:hidden={isCurrentMinimized}>
    {#each subjects as subject (`${subject.code}-${subject.section}`)}
      <li>
        <button
          type="button"
          class={[
            "size-7 mr-2 rounded-full text-center content-center cursor-pointer",
            type === "add" ? "bg-emerald-500" : "bg-red-400",
          ]}
          onclick={() => action(subject)}
        >
          {type === "add" ? "+" : "-"}
        </button>
        <pre class="inline mr-2">{subject.code}-{subject.section}</pre>
        {subject.name}
      </li>
    {/each}
  </ul>
{:else if emptyText}
  <span class="w-full p-4" class:hidden={isCurrentMinimized}>
    {emptyText}
  </span>
{/if}
