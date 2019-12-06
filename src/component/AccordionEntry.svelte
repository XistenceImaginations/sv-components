<template lang="pug">
    .svAccordionEntry(class="{expandedStyle}")
        .svAccordionEntry__title(on:click="{toggle}") {title}
        .svAccordionEntry__content
            slot
</template>

<script>
    export let title = 'N/A';

    let expanded = false;

    $: expandedStyle = expanded ? 'svAccordionEntry--expanded' : '';

    function toggle () {
        expanded = !expanded;
        console.log('toggle: '+expanded);

        // TODO later: check if only on entry should be opened at the same time.
    }
</script>

<style lang="scss" global>
    @import '../App';

    $svAccordionEntryTitleHeight: 32px;

    .svAccordionEntry {
        height: $svAccordionEntryTitleHeight;
        transition: height 250ms;
        overflow: hidden;

        &__title {
            background-color: var(--primary-color-light);
            color: white;
            width: 100%;
            height: $svAccordionEntryTitleHeight;
        }

        & + .svAccordionEntry {
            border-top: 1px solid rgba(255,255,255,.2);
        }

        &--expanded {
            height: max-content;

            & + .svAccordionEntry {
                border-top: 1px solid transparent;
            }
        }
    }
</style>
