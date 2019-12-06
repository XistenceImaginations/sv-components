<template lang="pug">
    .svDescription
        .svDescription__title {title}
        .svDescription__text
            slot
</template>

<script>
    export let title = 'N/A';
</script>

<style lang="scss" global>
    @import '../App';

    .svDescription {
        &__title {
            font-size: 1.5em;
        }

        &__text {
            padding-left: 1em;
            margin-bottom: 1em;
        }
    }
</style>
