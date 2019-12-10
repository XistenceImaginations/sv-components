<template lang="pug">
    dl.svDescription
        dt.svDescription__title {title}
        dd.svDescription__text
            slot
</template>

<script>
    export let title = 'N/A';
</script>

<style lang="scss" global>
    @import '../App';

    .svDescription {
        &__title {
            font-weight: bold;
            //font-style: italic;
            font-size: 1.25em;
            color: var(--text-color-light);

            &::before {
                content: '"';
            }

            &::after {
                content: '"';
            }
        }

        &__text {
            //padding-left: 1em;
            //margin-bottom: 1em;
        }
    }
</style>
