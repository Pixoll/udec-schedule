<script lang="ts">
  import "../app.css";
  import favicon from "$lib/assets/favicon.svg";
  import Spinner from "$lib/icons/Spinner.svelte";
  import { schedule } from "$lib/schedule";
  import api from "@/api";
  import { onMount } from "svelte";
  import type { LayoutProps } from "./$types";

  let { children }: LayoutProps = $props();

  let loading = $state(true);
  let error = $state<string>();

  onMount(async () => {
    try {
      const result = await api.getSchedule();

      if (result.error) {
        console.error(result.error);
      } else {
        $schedule = result.data;
      }
    } catch (e) {
      console.error(e);
      error = `${e as Error}`;
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon}/>
  <title>UdeC Horario (no oficial)</title>
</svelte:head>

<main>
  {#if loading}
    <div class="flex h-screen w-screen gap-2 items-center justify-center">
      <Spinner class="size-6"/>
      <span>Cargando...</span>
    </div>
  {:else if error}
    <div class="flex h-screen w-screen items-center justify-center">
      <span class="text-red-500">{error}. Por favor intenta de nuevo más tarde.</span>
    </div>
  {:else if !$schedule}
    <div class="flex h-screen w-screen items-center justify-center">
      <span class="text-red-500">No se pudo obtener los horarios. Por favor intenta de nuevo más tarde.</span>
    </div>
  {:else}
    {@render children()}
  {/if}
</main>
