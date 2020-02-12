<template lang="pug">
    .svAccordionEntry__title(on:click="{toggle}",bind:this="{titleElm}",class="{expandedTitle}") {title}
    .svAccordionEntry__content(bind:this="{contentElm}",class="{expandedContent}")
        slot
</template>

<script>
    export let title = 'N/A';

    let expanded = false;
    let titleElm;
    let contentElm;

    $: expandedTitle   = expanded ? 'svAccordionEntry__title--expanded' : '';
    $: expandedContent = expanded ? 'svAccordionEntry__content--expanded' : '';

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
        &__title {
            background-color: var(--primary-color-lighter);
            border-top: 1px solid  var(--primary-color-lighter);
            color: white;
            width: 100%;
            padding: .5em;
            font-size: 1.25em;
            font-weight: normal;
            transition: background-color 250ms ease-in;
            cursor: pointer;

            &::before {
                font-family: 'xi_icon_collection';
                font-size: .75em;
                font-weight: lighter;
                content: '\e87c';
                margin-right: 8px;
                color: rgba(255,255,255,.5);
                transition: padding 250ms ease-in;
            }

            &--expanded {
                font-weight: bolder;
                background-color: var(--primary-color-light);

                &::before {
                    content: '\e87e';
                    padding-right: .5em;
                }
            }

            &:nth-child(1) {
                border-top: none;
            }
        }

        &__content {
            max-height: 0;
            transition: max-height 250ms ease-out, margin 250ms ease-out;
            overflow: hidden;
            margin: 0 1em;

            &--expanded {
                margin: 1em 1em;
                max-height: 1200px;
                transition: max-height 250ms ease-in, margin 250ms ease-in;
            }
        }
    }
</style>
