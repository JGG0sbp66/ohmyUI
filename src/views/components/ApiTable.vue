<!-- src/views/components/ApiTable.vue -->
<script setup lang="ts">
type ApiRow = readonly [name: string, type: string, defaultValue: string, description: string];

defineProps<{
  caption: string;
  rows: readonly ApiRow[];
}>();
</script>

<template>
  <div class="mt-6 overflow-x-auto">
    <table class="w-full min-w-160 border-collapse text-left font-mono text-xs">
      <caption class="sr-only">
        {{
          caption
        }}
      </caption>
      <thead>
        <tr class="text-fg-muted">
          <th scope="col" class="border-b border-border/60 py-2 pr-4 font-normal">
            prop / slot / event
          </th>
          <th scope="col" class="border-b border-border/60 py-2 pr-4 font-normal">类型</th>
          <th scope="col" class="border-b border-border/60 py-2 pr-4 font-normal">默认</th>
          <th scope="col" class="border-b border-border/60 py-2 font-normal">说明</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row[0]" class="text-fg-muted">
          <th scope="row" class="border-b border-border/40 py-2.5 pr-4 font-normal text-fg">
            {{ row[0] }}
          </th>
          <td class="border-b border-border/40 py-2.5 pr-4">{{ row[1] }}</td>
          <td class="border-b border-border/40 py-2.5 pr-4">{{ row[2] }}</td>
          <td class="border-b border-border/40 py-2.5">{{ row[3] }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
