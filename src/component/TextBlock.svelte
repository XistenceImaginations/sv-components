<template lang="pug">
    p.svTextBlock(data-title="{title}",class:svTextBlock--withTitle="{(title)}")
        slot
</template>

<script>
    export let title = undefined;
</script>

<style lang="scss" global>
    @import '../App';

    .svTextBlock {
        &--withTitle {
            padding-left: 10px;

            &::before {
                content: attr(data-title);
                display: block;
                font-weight: bold;
                margin-left: -10px; // TODO use em
                margin-bottom: 10px; // TODO use em
            }
        }
    }
</style>
