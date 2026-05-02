<script lang="ts">
  import { onMount } from 'svelte';
  import { getSettings, saveSettings, DEFAULT_SETTINGS } from '$lib/db';
  import type { AppSettings } from '$lib/types';

  let settings: AppSettings = { ...DEFAULT_SETTINGS };
  let saved = false;

  const models = [
    { value: 'claude-haiku-4-5-20251001', label: 'Haiku', desc: 'Fast & cheap' },
    { value: 'claude-sonnet-4-6',         label: 'Sonnet', desc: 'Balanced' },
    { value: 'claude-opus-4-7',           label: 'Opus',   desc: 'Most capable' },
  ] as const;

  onMount(async () => {
    settings = await getSettings();
  });

  async function save() {
    await saveSettings(settings);
    saved = true;
    setTimeout(() => (saved = false), 2000);
  }
</script>

<div class="mx-auto max-w-md px-4 pt-10">
  <h1 class="mb-8 text-2xl font-bold text-stone-900">Settings</h1>

  <form on:submit|preventDefault={save} class="space-y-8">

    <!-- Feed -->
    <section>
      <p class="label mb-4">Feed</p>
      <div class="space-y-4 rounded-3xl border border-stone-100 bg-white p-5 shadow-sm">
        <div>
          <label class="flex items-center justify-between" for="cardsPerDay">
            <span class="text-sm font-medium text-stone-700">Cards per day</span>
            <span class="text-sm font-semibold text-stone-900">{settings.cardsPerDay}</span>
          </label>
          <input
            id="cardsPerDay"
            type="range"
            min="3" max="12"
            bind:value={settings.cardsPerDay}
            class="mt-2 w-full accent-stone-900"
          />
        </div>
      </div>
    </section>

    <!-- Notifications -->
    <section>
      <p class="label mb-4">Reminder</p>
      <div class="rounded-3xl border border-stone-100 bg-white p-5 shadow-sm">
        <label class="label" for="notifTime">Daily reminder time</label>
        <input
          id="notifTime"
          type="time"
          class="input"
          bind:value={settings.notificationTime}
        />
        <p class="mt-2 text-xs text-stone-400">You'll get a nudge if you haven't added a note by this time.</p>
      </div>
    </section>

    <!-- AI / Context Lens -->
    <section>
      <p class="label mb-4">AI — Context Lens</p>
      <div class="space-y-4 rounded-3xl border border-stone-100 bg-white p-5 shadow-sm">
        <div>
          <label class="label" for="apiKey">Claude API Key</label>
          <input
            id="apiKey"
            type="password"
            class="input font-mono text-xs"
            bind:value={settings.claudeApiKey}
            placeholder="sk-ant-…"
            autocomplete="off"
          />
          <p class="mt-1.5 text-xs text-stone-400">Stored locally only. Never sent anywhere except the Anthropic API.</p>
        </div>

        <div>
          <p class="label mb-3">Model</p>
          <div class="space-y-2">
            {#each models as m}
              <label class="flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-colors {settings.aiModel === m.value ? 'border-stone-900 bg-stone-50' : 'border-stone-100'}">
                <input type="radio" class="accent-stone-900" bind:group={settings.aiModel} value={m.value} />
                <span class="flex-1">
                  <span class="text-sm font-semibold text-stone-900">{m.label}</span>
                  <span class="ml-2 text-xs text-stone-400">{m.desc}</span>
                </span>
              </label>
            {/each}
          </div>
          <p class="mt-2 text-xs text-stone-400">Only affects live API calls. Cached contexts are unaffected.</p>
        </div>
      </div>
    </section>

    <button type="submit" class="btn-primary w-full">
      {saved ? '✓ Saved' : 'Save Settings'}
    </button>
  </form>

  <p class="mt-8 text-center text-xs text-stone-300">BookBit v0.1.0</p>
</div>
