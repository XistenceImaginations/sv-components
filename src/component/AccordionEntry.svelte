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
        &__title {
            background-color: var(--primary-color-light);
            color: white;
            width: 100%;
            padding: .5em;
            font-size: 1.25em;
            font-weight: bolder;

            &::before {
                font-family: 'xi_icon_collection';
                font-size: .75em;
                font-weight: lighter;
                content: '\e87c';
                margin-right: 8px;
                color: rgba(255,255,255,.5);
            }
        }

        &__content {
            overflow: hidden;
            height: 0;
            margin: 0 .5em;
            //max-height: 0;
            //transition: max-height 500ms ease-out;
        }

        & + .svAccordionEntry {
            border-top: 1px solid  var(--primary-color-lighter);
        }

        &--expanded {
            .svAccordionEntry {
                &__title {
                    &::before {
                        content: '\e87e';
                    }
                }

                &__content {
                    height: min-content;
                    margin: .5em;
                    //max-height: 80px;
                    //transition: max-height 500ms ease-in;
                }
            }

            & + .svAccordionEntry {
                border-top: 1px solid transparent;
            }
        }
    }
</style>
