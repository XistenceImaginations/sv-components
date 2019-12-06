<!--
    Acts as container to be used along with Grid. A single 'tile' can have a width and height defined
    where the size is related to an amount of 'cells' inside the grid (and not pixels).
    Additionally you can define a 'gap' that is a sort of padding around the tile content and the tile itself.
-->
<template lang="pug">
    .svTile(data-tileSize="{tileSize}",on:mouseenter="{enter}",on:mouseleave="{leave}",class:hovered,class="{clipped}")
        .svTile__wrapper
            .svTile__wrapper_content(style="{tilePadding}")
                .svTile__wrapper_content_view
                    slot
</template>

<script>
    export let clip   = true;
    export let gap    = '0';
    export let height = 1;
    export let width  = 1;

    let hovered = false;

    $: tileSize    = width + ':' + height;
    $: tilePadding = 'padding:' + gap + ';';
    $: clipped     = clip ? '' : 'svTile--unclipped';

    function enter (e) {
        hovered = true;
    }

    function leave (e) {
        hovered = false;
    }
</script>

<style lang="scss" global>
    .svTile { // this defines the tile itself, esepcially the width/height related to a grid-cell
        width: 100%; // TODO instead of 100% we could also use a fix value, that way tiles would wrap as they would stick to a specific size
        flex-basis: 100%; // TODO instead of 100% we could also use a fix value, that way tiles would wrap as they would stick to a specific size
        float: left;

        &__wrapper { // this forces an aspect ratio defined by used cell-width/-height
            width: 100%;
            height: 0;
            position: relative;

            &_content { // this is used to provide a padding for the tile
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;

                &_view { // this is used to provide a deterministic dimension for all the content inside the tile
                    position: relative;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                }
            }
        }

        &--unclipped {
            .svTile__wrapper_content_view {
                overflow: initial;
            }
        }

        @for $i from 1 through 12 { // TODO make the amount of columsn configurable AND do this for different breakpoints
            @for $j from 1 through 12 {
                &[data-tileSize="#{$i}:#{$j}"] {
                    flex-basis: calc(100% / 12 * #{$i}); // TODO instead of 100% we could also use a fix value, that way tiles would wrap as they would stick to a specific size

                    .svTile__wrapper {
                        padding-top: calc(100% / (#{$i} / #{$j})); // TODO instead of 100% we could also use a fix value, that way tiles would wrap as they would stick to a specific size
                    }
                }
            }
        }
    }

    :global(body.debug) {
        & .svTile {
            &__wrapper_content {
                border: 1px solid var(--debug-color);;
            }
        }
    }
</style>
