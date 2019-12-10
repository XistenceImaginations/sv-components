<template lang="pug">
    .svPageBlock(style="{bgStyle}",class="{isHatched}")
        slot
</template>

<script>
    export let color = undefined;
    export let hatched = undefined;

    $: bgStyle   = color ? 'background-color:' + color + ';' : undefined;
    $: isHatched = hatched ? 'svPageBlock--hatched' : undefined;
</script>

<style lang="scss" global>
    @import '../App';

    $svPagePaddings  : ('xs': 0, 'sm': 0 1em, 'md': 0 1em, 'lg': 0 2em);
    $svPageHatchLineColor: rgba(127, 63, 63, .5);
    $svPageHatchBackColor: rgba(255, 0, 0, .1);

    .svPageBlock {
        padding: map-get($svPagePaddings, 'xs');

        &--hatched { // TODO make use of .--hatched -> App.scss
            background: repeating-linear-gradient(45deg, $svPageHatchLineColor, $svPageHatchLineColor 1px, $svPageHatchBackColor 1px, $svPageHatchBackColor 20px);
        }
    }

    @mixin bp($bps) {
        @each $bp in $bps {
            @media only screen and (min-width: #{bp($bp)}) {
                .svPageBlock {
                    padding: map-get($svPagePaddings, $bp);
                }
            }
        }
    }

    @include bp($breakPoints);
</style>
