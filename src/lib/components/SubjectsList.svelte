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

  let { subjects, type, action, title, searchValue = $bindable(), searchPlaceholder, emptyText }: Props = $props();
</script>

{#if searchValue !== undefined}
  <label for="subject-search" class="block w-fit mb-2">
    {title}
  </label>
  <input
    id="subject-search"
    class="block w-full mb-6"
    placeholder={searchPlaceholder}
    bind:value={searchValue}
  />
{:else}
  <span class="block mb-4">
    {title}
  </span>
{/if}

{#if !emptyText || (Array.isArray(subjects) ? subjects.length : subjects.size) > 0}
  <ul class="w-full max-h-96 p-4 space-y-4 overflow-y-scroll">
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
  <span class="w-full p-4">
    {emptyText}
  </span>
{/if}
