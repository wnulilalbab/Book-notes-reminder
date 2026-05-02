<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { base } from '$app/paths';

  const navItems = [
    { href: '/',         label: 'Feed',     icon: 'M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1V10' },
    { href: '/library',  label: 'Library',  icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { href: '/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ];

  $: currentPath = $page.url.pathname;
  $: isWidget = currentPath === base + '/widget/';
</script>

{#if isWidget}
  <slot />
{:else}
  <div class="flex min-h-dvh flex-col">
    <main class="flex-1 pb-24">
      <slot />
    </main>

    <nav class="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-100 bg-white/90 backdrop-blur-md">
      <div class="mx-auto flex max-w-md items-center justify-around px-2 pb-safe">
        {#each navItems as item}
          {@const active = currentPath === base + item.href + '/'}
          <a
            href="{base}{item.href}"
            class="flex flex-col items-center gap-1 px-4 py-3 text-xs font-medium transition-colors {active ? 'text-stone-900' : 'text-stone-400'}"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
              {#each item.icon.split('M').filter(Boolean) as d, i}
                <path stroke-linecap="round" stroke-linejoin="round" d="M{d}" />
              {/each}
            </svg>
            {item.label}
          </a>
        {/each}
      </div>
    </nav>
  </div>
{/if}
