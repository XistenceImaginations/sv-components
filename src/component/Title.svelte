<!--
    A simple title element.
-->
<template lang="pug">
    .svTitle(class="{sizeCls}")
        slot
</template>

<script>
    export let size = 1;

    $: sizeCls = 'svTitle--size' + size;
</script>

<style lang="scss" global>
    @import '../App';

    $svTitleLevels: 1, 2, 3, 4, 5, 6; // sizes are similar like H1..6 - the smaller the number the larger the size
    $svTitleSizes: ('xs': 2em 3em, 'sm': 1em 2em, 'md': .75em 1.5em, 'lg': 1em 2em);

    .svTitle {
        font-weight: bolder;
    }

    @mixin bp($bps) {
        @each $bp in $bps {
            $sizes: map-get($svTitleSizes, $bp); // fetches the height for the nav

            @media only screen and (min-width: #{bp($bp)}) { // bp() from App.scss return a PX-value for a given breakpoint-key
                @each $svTitleLevel in $svTitleLevels {
                    .svTitle--size#{$svTitleLevel} {
                        $mn: nth($sizes, 1);
                        $mx: nth($sizes, 2);
                        $d: $mx - $mn; // the delta between min and max. this is the range we spilt into part and use for our 'levels'
                        $l: length($svTitleLevels); // the length of the sizes-list. that way we just need to modify the list, everything else is automatic
                        $s: $d / $l; // a single step between min and max
                        $S: $mn + $s + ($d - ($s * $svTitleLevel)); // calculation of the final sze
                        font-size: #{$S};
                        margin: calc(#{$S} / 2) 0; // for now the top/bottom margin is just half (each) of the font-size
                    }
                }
            }
        }
    }

    @include bp($breakPoints);
</style>
