<template lang="pug">
    a.svIcon(title="{title}", alt="{title}", href="{url}",class="icon-{icon}")
</template>

<script>
    export let title = '';
    export let url   = '';
    export let icon  = '';
</script>

<style lang="scss" global>
    @import '../App';

    .svIcon {
        color: var(--primary-color);
        padding: 0 .25em;
        transition: color var(--animation-duration);
        text-decoration: none;

        &:hover {
            color: var(--primary-color-light);
        }
    }
</style>
