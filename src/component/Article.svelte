<template lang="pug">
    .svArticle
        h2.svArticle__title {title}
        .svArticle__content
            slot
</template>

<script>
    export let title = 'N/A';
</script>

<style lang="scss" global>
    @import '../App';

    .svArticle {
        position: relative;

        &__title {

        }

        &__content {
            padding-left: 1.5em;
        }
    }
</style>
