<!--
Used when we need to display title and the value inside a container
-->
<template>
  <div class="mb-2">
    <span class="font-weight-bold">{{ propertyTitle }}</span>
  </div>
  <div class="mb-2 text-muted">
    {{ propertyValue }}
  </div>
</template>

<script lang="ts">
export default {
  props: {
    propertyTitle: {
      type: String,
      required: true,
    },
    propertyValue: {
      type: String,
      required: true,
    },
  },
};
</script>
